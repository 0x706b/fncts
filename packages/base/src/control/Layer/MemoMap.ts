import type { Fresh } from "@fncts/base/control/Layer/definition";

import { LayerHash, LayerTag } from "@fncts/base/control/Layer/definition";
import { tuple } from "@fncts/base/data/function";

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
  getOrElseMemoize = <R, E, A>(scope: Scope, layer: Layer<R, E, A>) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return this.ref.modifyIO((map) => {
      const inMap = map.get(layer[LayerHash]);

      if (inMap.isJust()) {
        const [acquire, release] = inMap.value;

        const cached = (acquire as FIO<E, A>).onExit((exit) =>
          exit.match(
            () => IO.unit,
            () => scope.addFinalizerExit(release),
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
              const environment = yield* _(IO.environment<R>());
              const outerScope  = scope;
              const innerScope  = yield* _(Scope.make);

              const tp = yield* _(
                restore(layer.scope(innerScope).chain((f) => f(self))).result.chain((exit) =>
                  exit.match(
                    (cause) =>
                      future.failCause(cause) > innerScope.close(exit) > IO.failCauseNow(cause),
                    (a) =>
                      IO.gen(function* (_) {
                        yield* _(
                          finalizerRef
                            .set(Finalizer.get((exit) => innerScope.close(exit)))
                            .whenIO(observers.modify((n) => [n === 1, n - 1])),
                        );
                        yield* _(observers.update((n) => n + 1));
                        yield* _(
                          outerScope.addFinalizerExit(
                            Finalizer.get((e) =>
                              finalizerRef.get.chain((fin) => Finalizer.reverseGet(fin)(e)),
                            ),
                          ),
                        );
                        yield* _(future.succeed(a));
                        return a;
                      }),
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
    }).flatten;
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
export function build<R, E, A>(self: Layer<R, E, A>): IO<R & Has<Scope>, E, A> {
  return IO.serviceWithIO(Scope.Tag)((scope) => self.build(scope));
}

/**
 * @tsplus fluent fncts.control.Layer build
 */
export function build_<R, E, A>(self: Layer<R, E, A>, scope: Scope): IO<R, E, A> {
  return IO.gen(function* (_) {
    const memoMap = yield* _(makeMemoMap());
    const run     = yield* _(self.scope(scope));
    return yield* _(run(memoMap));
  });
}

/**
 * @tsplus fluent fncts.control.Layer scope
 */
export function scope<R, E, A>(
  layer: Layer<R, E, A>,
  scope: Scope,
): IO<unknown, never, (_: MemoMap) => IO<R, E, A>> {
  layer.concrete();
  switch (layer._tag) {
    case LayerTag.Fold: {
      return IO.succeed(
        () => (memoMap: MemoMap) =>
          memoMap.getOrElseMemoize(scope, layer.self).matchCauseIO(
            (cause) => memoMap.getOrElseMemoize(scope, layer.failure(cause)),
            (r) => memoMap.getOrElseMemoize(scope, layer.success(r)),
          ),
      );
    }
    case LayerTag.Fresh: {
      return IO.succeed(() => () => layer.self.build(scope));
    }
    case LayerTag.Scoped: {
      return IO.succeed(() => () => scope.extend(layer.self));
    }
    case LayerTag.Defer: {
      return IO.succeed(() => (memoMap: MemoMap) => memoMap.getOrElseMemoize(scope, layer.self()));
    }
    case LayerTag.To: {
      return IO.succeed(
        () => (memoMap: MemoMap) =>
          memoMap
            .getOrElseMemoize(scope, layer.self)
            .chain((r) => memoMap.getOrElseMemoize(scope, layer.that).provideEnvironment(r)),
      );
    }
    case LayerTag.ZipWith: {
      return IO.succeed(
        () => (memoMap: MemoMap) =>
          memoMap
            .getOrElseMemoize(scope, layer.self)
            .zipWith(memoMap.getOrElseMemoize(scope, layer.that), layer.f),
      );
    }
    case LayerTag.ZipWithC: {
      return IO.succeed(
        () => (memoMap: MemoMap) =>
          memoMap
            .getOrElseMemoize(scope, layer.self)
            .zipWithC(memoMap.getOrElseMemoize(scope, layer.that), layer.f),
      );
    }
  }
}
