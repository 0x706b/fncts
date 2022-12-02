import type { Fresh } from "@fncts/io/Layer/definition";

import { tuple } from "@fncts/base/data/function";
import { LayerHash, LayerTag } from "@fncts/io/Layer/definition";

/**
 * A `MemoMap` memoizes dependencies.
 */
export class MemoMap {
  constructor(readonly ref: Ref.Synchronized<HashMap<PropertyKey, readonly [FIO<any, any>, Finalizer]>>) {}

  /**
   * Checks the memo map to see if a dependency exists. If it is, immediately
   * returns it. Otherwise, obtains the dependency, stores it in the memo map,
   * and adds a finalizer to the outer `Managed`.
   */
  getOrElseMemoize = <R, E, A>(scope: Scope, layer: Layer<R, E, A>, __tsplusTrace?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    return this.ref.modifyIO((map) => {
      const inMap = map.get(layer[LayerHash]);

      if (inMap.isJust()) {
        const [acquire, release] = inMap.value;

        const cached = (acquire as FIO<E, Environment<A>>).onExit((exit) =>
          exit.match(
            () => IO.unit,
            () => scope.addFinalizerExit(release),
          ),
        );

        return IO.succeedNow(tuple(cached, map));
      } else {
        return Do((_) => {
          const observers    = _(Ref.make(0));
          const future       = _(Future.make<E, Environment<A>>());
          const finalizerRef = _(Ref.make<Finalizer>(Finalizer.noop));
          const resource     = IO.uninterruptibleMask((restore) =>
            Do((_) => {
              const outerScope = scope;
              const innerScope = _(Scope.make);
              const tp         = _(
                restore(layer.scope(innerScope).flatMap((f) => f(this))).result.flatMap((exit) =>
                  exit.match(
                    (cause) => future.failCause(cause) > innerScope.close(exit) > IO.failCauseNow(cause),
                    (a) =>
                      Do((_) => {
                        _(
                          finalizerRef
                            .set(Finalizer.get((exit) => innerScope.close(exit)))
                            .whenIO(observers.modify((n) => [n === 1, n - 1])),
                        );
                        _(observers.update((n) => n + 1));
                        _(
                          outerScope.addFinalizerExit(
                            Finalizer.get((e) => finalizerRef.get.flatMap((fin) => Finalizer.reverseGet(fin)(e))),
                          ),
                        );
                        _(future.succeed(a));
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
            Finalizer.get((exit: Exit<any, any>) => finalizerRef.get.flatMap((f) => Finalizer.reverseGet(f)(exit))),
          );

          return tuple(resource, layer.isFresh() ? map : map.set(layer[LayerHash], memoized));
        });
      }
    }).flatten;
  };
}

/**
 * @tsplus fluent fncts.io.Layer isFresh
 */
export function isFresh<R, E, A>(self: Layer<R, E, A>): self is Fresh<R, E, A> {
  self.concrete();
  return self._tag === LayerTag.Fresh;
}

export function makeMemoMap(__tsplusTrace?: string): UIO<MemoMap> {
  return Ref.Synchronized.make(HashMap.empty<PropertyKey, readonly [FIO<any, any>, Finalizer]>()).flatMap((ref) =>
    IO.succeedNow(new MemoMap(ref)),
  );
}

/**
 * @tsplus getter fncts.io.Layer build
 */
export function build<R, E, A>(self: Layer<R, E, A>, __tsplusTrace?: string): IO<R | Scope, E, Environment<A>> {
  return IO.serviceWithIO((scope: Scope) => self.build(scope), Scope.Tag);
}

/**
 * @tsplus pipeable fncts.io.Layer build
 */
export function build_(scope: Scope, __tsplusTrace?: string) {
  return <R, E, A>(self: Layer<R, E, A>): IO<R, E, Environment<A>> => {
    return Do((_) => {
      const memoMap = _(makeMemoMap());
      const run     = _(self.scope(scope));
      return _(run(memoMap));
    });
  };
}

/**
 * @tsplus pipeable fncts.io.Layer scope
 */
export function scope(scope: Scope, __tsplusTrace?: string) {
  return <R, E, A>(layer: Layer<R, E, A>): IO<never, never, (_: MemoMap) => IO<R, E, Environment<A>>> => {
    layer.concrete();
    switch (layer._tag) {
      case LayerTag.Fold: {
        return IO.succeed(
          () => (memoMap: MemoMap) =>
            memoMap.getOrElseMemoize(scope, layer.self, layer.trace).matchCauseIO(
              (cause) => memoMap.getOrElseMemoize(scope, layer.failure(cause), layer.trace),
              (r) => memoMap.getOrElseMemoize(scope, layer.success(r)),
              layer.trace,
            ),
        );
      }
      case LayerTag.Fresh: {
        return IO.succeed(() => () => layer.self.build(scope, layer.trace));
      }
      case LayerTag.Scoped: {
        return IO.succeed(() => () => scope.extend(layer.self, layer.trace));
      }
      case LayerTag.Defer: {
        return IO.succeed(() => (memoMap: MemoMap) => memoMap.getOrElseMemoize(scope, layer.self(), layer.trace));
      }
      case LayerTag.To: {
        return IO.succeed(
          () => (memoMap: MemoMap) =>
            memoMap
              .getOrElseMemoize(scope, layer.self, layer.trace)
              .flatMap(
                (r) => memoMap.getOrElseMemoize(scope, layer.that, layer.trace).provideEnvironment(r),
                layer.trace,
              ),
        );
      }
      case LayerTag.ZipWith: {
        return IO.succeed(
          () => (memoMap: MemoMap) =>
            memoMap
              .getOrElseMemoize(scope, layer.self, layer.trace)
              .zipWith(memoMap.getOrElseMemoize(scope, layer.that, layer.trace), layer.f, layer.trace),
        );
      }
      case LayerTag.ZipWithConcurrent: {
        return IO.succeed(
          () => (memoMap: MemoMap) =>
            memoMap
              .getOrElseMemoize(scope, layer.self, layer.trace)
              .zipWithConcurrent(memoMap.getOrElseMemoize(scope, layer.that, layer.trace), layer.f, layer.trace),
        );
      }
    }
  };
}
