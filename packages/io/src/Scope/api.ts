import { Closeable } from "./definition.js";
import { ReleaseMap } from "./ReleaseMap.js";

/**
 * @tsplus fluent fncts.io.Scope addFinalizer
 */
export function addFinalizer_(self: Scope, finalizer: Lazy<UIO<any>>): UIO<void> {
  return self.addFinalizerExit(Finalizer.get(() => finalizer()));
}

/**
 * @tsplus static fncts.io.ScopeOps addFinalizer
 */
export function addFinalizer(finalizer: Lazy<UIO<void>>): IO<Scope, never, void> {
  return IO.serviceWithIO((scope) => scope.addFinalizer(finalizer), Scope.Tag);
}

/**
 * @tsplus static fncts.io.ScopeOps concurrent
 * @tsplus static fncts.io.Scope.CloseableOps concurrent
 */
export const concurrent: UIO<Scope.Closeable> = makeWith(ExecutionStrategy.concurrent);

/**
 * @tsplus fluent fncts.io.Scope extend
 */
export function extend_<R, E, A>(self: Scope, io: Lazy<IO<R, E, A>>): IO<Exclude<R, Scope>, E, A> {
  return IO.defer(io).contramapEnvironment((r) => r.union(Environment.empty.add(self, Scope.Tag)));
}

/**
 * @tsplus static fncts.io.ScopeOps global
 */
export const global: Scope.Closeable = new (class extends Closeable {
  addFinalizerExit(_finalizer: Finalizer): UIO<void> {
    return IO.unit;
  }
  close(_exit: Lazy<Exit<any, any>>): UIO<void> {
    return IO.unit;
  }
  get fork(): UIO<Scope.Closeable> {
    return Scope.make;
  }
})();

/**
 * @tsplus static fncts.io.ScopeOps make
 * @tsplus static fncts.io.Scope.CloseableOps make
 */
export const make: UIO<Scope.Closeable> = makeWith(ExecutionStrategy.sequential);

/**
 * @tsplus static fncts.io.ScopeOps makeWith
 * @tsplus static fncts.io.Scope.CloseableOps makeWith
 */
export function makeWith(executionStrategy: Lazy<ExecutionStrategy>): UIO<Scope.Closeable> {
  return ReleaseMap.make.map(
    (releaseMap) =>
      new (class extends Closeable {
        addFinalizerExit(finalizer: Finalizer): UIO<void> {
          return releaseMap.add(finalizer).asUnit;
        }
        close(exit: Lazy<Exit<any, any>>): UIO<void> {
          return IO.defer(releaseMap.releaseAll(exit(), executionStrategy()).asUnit);
        }
        get fork() {
          return IO.uninterruptible(
            Do((_) => {
              const scope     = _(Scope.make);
              const finalizer = _(releaseMap.add(Finalizer.get((exit) => scope.close(exit))));
              _(scope.addFinalizerExit(finalizer));
              return scope;
            }),
          );
        }
      })(),
  );
}

/**
 * @tsplus static fncts.io.ScopeOps unsafeMake
 */
export function unsafeMake() {
  return unsafeMakeWith(ExecutionStrategy.sequential);
}

/**
 * @tsplus static fncts.io.ScopeOps unsafeMakeWith
 */
export function unsafeMakeWith(executionStrategy: ExecutionStrategy): Scope.Closeable {
  const releaseMap = ReleaseMap.unsafeMake();
  return new (class extends Closeable {
    addFinalizerExit(finalizer: Finalizer): UIO<void> {
      return releaseMap.add(finalizer).asUnit;
    }
    close(exit: Lazy<Exit<any, any>>): UIO<void> {
      return IO.defer(releaseMap.releaseAll(exit(), executionStrategy).asUnit);
    }
    get fork() {
      return IO.uninterruptible(
        Do((_) => {
          const scope     = _(Scope.make);
          const finalizer = _(releaseMap.add(Finalizer.get((exit) => scope.close(exit))));
          _(scope.addFinalizerExit(finalizer));
          return scope;
        }),
      );
    }
  })();
}

/**
 * @tsplus fluent fncts.io.Scope.Closeable use
 */
export function use_<R, E, A>(self: Scope.Closeable, io: Lazy<IO<R, E, A>>): IO<Exclude<R, Scope>, E, A> {
  return self.extend(io).onExit((exit) => self.close(exit));
}
