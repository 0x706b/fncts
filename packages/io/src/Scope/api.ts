import { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";

import { Closeable } from "./definition.js";
import { ReleaseMap } from "./ReleaseMap.js";

/**
 * @tsplus pipeable fncts.io.Scope addFinalizer
 */
export function addFinalizer(finalizer: Lazy<UIO<any>>, __tsplusTrace?: string) {
  return (self: Scope): UIO<void> => {
    return self.addFinalizerExit(Finalizer.get(() => finalizer()));
  };
}

/**
 * @tsplus static fncts.io.ScopeOps addFinalizer
 */
export function makeAddFinalizer(finalizer: Lazy<UIO<void>>, __tsplusTrace?: string): IO<Scope, never, void> {
  return IO.serviceWithIO((scope) => scope.addFinalizer(finalizer), Scope.Tag);
}

/**
 * @tsplus static fncts.io.ScopeOps concurrent
 * @tsplus static fncts.io.Scope.CloseableOps concurrent
 */
export const concurrent: UIO<Scope.Closeable> = makeWith(ExecutionStrategy.concurrent);

/**
 * @tsplus pipeable fncts.io.Scope extend
 */
export function extend<R, E, A>(io: Lazy<IO<R, E, A>>, __tsplusTrace?: string) {
  return (self: Scope): IO<Exclude<R, Scope>, E, A> => {
    return IO.defer(io).contramapEnvironment((r) => r.union(Environment.empty.add(self, Scope.Tag)));
  };
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
  forkWith(executionStrategy: Lazy<ExecutionStrategy>): UIO<Scope.Closeable> {
    return Scope.makeWith(executionStrategy);
  }
})();

/**
 * @tsplus static fncts.io.ScopeOps make
 * @tsplus static fncts.io.Scope.CloseableOps make
 */
export const make: UIO<Scope.Closeable> = makeWith(ExecutionStrategy.sequential);

/**
 * @tsplus getter fncts.io.Scope fork
 */
export function fork(scope: Scope): UIO<Scope.Closeable> {
  return scope.forkWith(scope.executionStrategy);
}

/**
 * @tsplus static fncts.io.ScopeOps makeWith
 * @tsplus static fncts.io.Scope.CloseableOps makeWith
 */
export function makeWith(executionStrategy0: Lazy<ExecutionStrategy>, __tsplusTrace?: string): UIO<Scope.Closeable> {
  return ReleaseMap.make.map((releaseMap) => {
    const executionStrategy = executionStrategy0();
    return new (class extends Closeable {
      addFinalizerExit(finalizer: Finalizer): UIO<void> {
        return releaseMap.add(finalizer).asUnit;
      }
      close(exit: Lazy<Exit<any, any>>): UIO<void> {
        return IO.defer(releaseMap.releaseAll(exit(), executionStrategy).asUnit);
      }
      executionStrategy: ExecutionStrategy = executionStrategy;
      forkWith(executionStrategy: Lazy<ExecutionStrategy>) {
        return IO.uninterruptible(
          Do((_) => {
            const scope     = _(Scope.makeWith(executionStrategy));
            const finalizer = _(releaseMap.add(Finalizer.get((exit) => scope.close(exit))));
            _(scope.addFinalizerExit(finalizer));
            return scope;
          }),
        );
      }
    })();
  });
}

/**
 * @tsplus static fncts.io.ScopeOps unsafeMake
 */
export function unsafeMake(__tsplusTrace?: string) {
  return unsafeMakeWith(ExecutionStrategy.sequential);
}

/**
 * @tsplus static fncts.io.ScopeOps unsafeMakeWith
 */
export function unsafeMakeWith(executionStrategy: ExecutionStrategy, __tsplusTrace?: string): Scope.Closeable {
  const releaseMap = ReleaseMap.unsafeMake();
  return new (class extends Closeable {
    addFinalizerExit(finalizer: Finalizer): UIO<void> {
      return releaseMap.add(finalizer).asUnit;
    }
    close(exit: Lazy<Exit<any, any>>): UIO<void> {
      return IO.defer(releaseMap.releaseAll(exit(), executionStrategy).asUnit);
    }
    forkWith(executionStrategy: Lazy<ExecutionStrategy>) {
      return IO.uninterruptible(
        Do((_) => {
          const scope     = _(Scope.makeWith(executionStrategy));
          const finalizer = _(releaseMap.add(Finalizer.get((exit) => scope.close(exit))));
          _(scope.addFinalizerExit(finalizer));
          return scope;
        }),
      );
    }
  })();
}

/**
 * @tsplus pipeable fncts.io.Scope.Closeable use
 */
export function use<R, E, A>(io: Lazy<IO<R, E, A>>, __tsplusTrace?: string) {
  return (self: Scope.Closeable): IO<Exclude<R, Scope>, E, A> => {
    return self.extend(io).onExit((exit) => self.close(exit));
  };
}
