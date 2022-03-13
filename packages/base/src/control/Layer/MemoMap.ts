import type { Exit } from "../../data/Exit.js";
import type { FIO, UIO } from "../IO.js";
import type { Fresh, Layer } from "./definition.js";

import { HashMap } from "../../collection/immutable/HashMap.js";
import { ExecutionStrategy } from "../../data/ExecutionStrategy.js";
import { tuple } from "../../data/function.js";
import { FiberRef } from "../FiberRef.js";
import { Future } from "../Future.js";
import { IO } from "../IO.js";
import { Managed } from "../Managed.js";
import { Finalizer } from "../Managed/Finalizer.js";
import { ReleaseMap } from "../Managed/ReleaseMap.js";
import { Ref } from "../Ref.js";
import { LayerTag } from "./definition.js";
import { LayerHash } from "./definition.js";

/**
 * A `MemoMap` memoizes dependencies.
 */
export class MemoMap {
  constructor(
    readonly ref: Ref.Synchronized<HashMap<PropertyKey, readonly [FIO<any, any>, Finalizer]>>,
  ) {}

  /**
   * Checks the memo map to see if a dependency exists. If it is, immediately
   * returns it. Otherwise, obtains the dependency, stores it in the memo map,
   * and adds a finalizer to the outer `Managed`.
   */
  getOrElseMemoize = <R, E, A>(layer: Layer<R, E, A>) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return new Managed<R, E, A>(
      this.ref.modifyIO((map) => {
        const inMap = map.get(layer[LayerHash]);

        if (inMap.isJust()) {
          const [acquire, release] = inMap.value;

          const cached = pipe(
            FiberRef.currentReleaseMap.get.chain((releaseMap) =>
              (acquire as FIO<E, A>)
                .onExit((exit) =>
                  exit.match(
                    () => IO.unit,
                    () => releaseMap.add(release),
                  ),
                )
                .map((a) => tuple(release, a)),
            ),
          );

          return IO.succeedNow(tuple(cached, map));
        } else {
          return IO.gen(function* (_) {
            const observers    = yield* _(Ref.make(0));
            const future       = yield* _(Future.make<E, A>());
            const finalizerRef = yield* _(Ref.make<Finalizer>(Finalizer.noop));

            const resource = IO.uninterruptibleMask(({ restore }) =>
              IO.gen(function* (_) {
                const outerReleaseMap = yield* _(FiberRef.currentReleaseMap.get);
                const innerReleaseMap = yield* _(ReleaseMap.make);
                const tp              = yield* _(
                  pipe(
                    restore(
                      pipe(
                        FiberRef.currentReleaseMap.locally(innerReleaseMap)(
                          scope(layer).chain((f) => f(self)).io,
                        ),
                      ),
                    ).result.chain((exit) =>
                      exit.match(
                        (cause): IO<unknown, E, readonly [Finalizer, A]> =>
                          pipe(
                            future
                              .failCause(cause)
                              .apSecond(
                                innerReleaseMap.releaseAll(
                                  exit,
                                  ExecutionStrategy.sequential,
                                ) as FIO<E, any>,
                              )
                              .apSecond(IO.failCauseNow(cause)),
                          ),
                        ([, b]) =>
                          IO.gen(function* (_) {
                            yield* _(
                              pipe(
                                finalizerRef.set(
                                  Finalizer.get((e) =>
                                    innerReleaseMap
                                      .releaseAll(e, ExecutionStrategy.sequential)
                                      .whenIO(observers.modify((n) => [n === 1, n - 1])),
                                  ),
                                ),
                              ),
                            );
                            yield* _(observers.update((n) => n + 1));
                            const outerFinalizer = yield* _(
                              outerReleaseMap.add(
                                Finalizer.get((e) =>
                                  finalizerRef.get.chain((f) => Finalizer.reverseGet(f)(e)),
                                ),
                              ),
                            );
                            yield* _(future.succeed(b));
                            return tuple(outerFinalizer, b);
                          }),
                      ),
                    ),
                  ),
                );
                return tp;
              }),
            );

            const memoized = tuple(
              future.await.onExit((exit) =>
                exit.match(
                  () => IO.unit,
                  () => observers.update((n) => n + 1),
                ),
              ),
              Finalizer.get((exit: Exit<any, any>) =>
                finalizerRef.get.chain((f) => Finalizer.reverseGet(f)(exit)),
              ),
            );

            return tuple(resource, layer.isFresh() ? map : map.set(layer[LayerHash], memoized));
          });
        }
      }).flatten,
    );
  };
}

/**
 * @tsplus fluent fncts.control.Layer isFresh
 */
export function isFresh<R, E, A>(self: Layer<R, E, A>): self is Fresh<R, E, A> {
  self.concrete();
  return self._tag === LayerTag.Fresh;
}

export function makeMemoMap(): UIO<MemoMap> {
  return Ref.Synchronized.make(
    HashMap.makeDefault<PropertyKey, readonly [FIO<any, any>, Finalizer]>(),
  ).chain((ref) => IO.succeedNow(new MemoMap(ref)));
}

/**
 * @tsplus getter fncts.control.Layer build
 */
export function build<R, E, A>(self: Layer<R, E, A>): Managed<R, E, A> {
  return Managed.gen(function* (_) {
    const memoMap = yield* _(Managed.fromIO(makeMemoMap()));
    const run     = yield* _(scope(self));
    return yield* _(run(memoMap));
  });
}

/**
 * @tsplus getter fncts.control.Layer scope
 */
export function scope<R, E, A>(
  layer: Layer<R, E, A>,
): Managed<unknown, never, (_: MemoMap) => Managed<R, E, A>> {
  layer.concrete();
  switch (layer._tag) {
    case LayerTag.Fold: {
      return Managed.succeed(
        () => (memoMap: MemoMap) =>
          memoMap.getOrElseMemoize(layer.self).matchCauseManaged(
            (cause) => memoMap.getOrElseMemoize(layer.failure(cause)),
            (r) => memoMap.getOrElseMemoize(layer.success(r)),
          ),
      );
    }
    case LayerTag.Fresh: {
      return Managed.succeed(() => () => layer.self.build);
    }
    case LayerTag.Managed: {
      return Managed.succeed(() => () => layer.self);
    }
    case LayerTag.Defer: {
      return Managed.succeed(() => (memoMap: MemoMap) => memoMap.getOrElseMemoize(layer.self()));
    }
    case LayerTag.To: {
      return Managed.succeed(
        () => (memoMap: MemoMap) =>
          memoMap
            .getOrElseMemoize(layer.self)
            .chain((r) => memoMap.getOrElseMemoize(layer.that).provideEnvironment(r)),
      );
    }
    case LayerTag.ZipWith: {
      return Managed.succeed(
        () => (memoMap: MemoMap) =>
          memoMap
            .getOrElseMemoize(layer.self)
            .zipWith(memoMap.getOrElseMemoize(layer.that), layer.f),
      );
    }
    case LayerTag.ZipWithC: {
      return Managed.succeed(
        () => (memoMap: MemoMap) =>
          memoMap
            .getOrElseMemoize(layer.self)
            .zipWithC(memoMap.getOrElseMemoize(layer.that), layer.f),
      );
    }
  }
}
