import type { Exit } from "../../data.js";
import type { Lazy } from "../../data/function.js";
import type { Has } from "../../prelude.js";
import type { UIO } from "../IO.js";

import { ExecutionStrategy } from "../../data/ExecutionStrategy.js";
import { IO } from "../IO.js";
import { Scope } from "./definition.js";
import { Closeable } from "./definition.js";
import { Finalizer } from "./Finalizer.js";
import { ReleaseMap } from "./ReleaseMap.js";

/**
 * @tsplus fluent fncts.control.Scope addFinalizer
 */
export function addFinalizer_(self: Scope, finalizer: Lazy<UIO<any>>): UIO<void> {
  return self.addFinalizerExit(Finalizer.get(() => finalizer()));
}

/**
 * @tsplus static fncts.control.ScopeOps addFinalizer
 */
export function addFinalizer(finalizer: Lazy<UIO<void>>): IO<Has<Scope>, never, void> {
  return IO.serviceWithIO(Scope.Tag)((scope) => scope.addFinalizer(finalizer));
}

/**
 * @tsplus static fncts.control.ScopeOps concurrent
 * @tsplus static fncts.control.Scope.CloseableOps concurrent
 */
export const concurrent: UIO<Scope.Closeable> = makeWith(ExecutionStrategy.concurrent);

/**
 * @tsplus fluent fncts.control.Scope extend
 */
export function extend_<R, E, A>(self: Scope, io: Lazy<IO<R & Has<Scope>, E, A>>): IO<R, E, A> {
  return IO.defer(io).contramapEnvironment((r) => ({ ...r, ...Scope.Tag.of(self) }));
}

/**
 * @tsplus static fncts.control.ScopeOps global
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
 * @tsplus static fncts.control.ScopeOps make
 * @tsplus static fncts.control.Scope.CloseableOps make
 */
export const make: UIO<Scope.Closeable> = makeWith(ExecutionStrategy.sequential);

/**
 * @tsplus static fncts.control.ScopeOps makeWith
 * @tsplus static fncts.control.Scope.CloseableOps makeWith
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
            IO.gen(function* (_) {
              const scope     = yield* _(Scope.make);
              const finalizer = yield* _(
                releaseMap.add(Finalizer.get((exit) => scope.close(exit))),
              );
              yield* _(scope.addFinalizerExit(finalizer));
              return scope;
            }),
          );
        }
      })(),
  );
}

/**
 * @tsplus static fncts.control.ScopeOps unsafeMake
 */
export function unsafeMake() {
  return unsafeMakeWith(ExecutionStrategy.sequential);
}

/**
 * @tsplus static fncts.control.ScopeOps unsafeMakeWith
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
        IO.gen(function* (_) {
          const scope     = yield* _(Scope.make);
          const finalizer = yield* _(releaseMap.add(Finalizer.get((exit) => scope.close(exit))));
          yield* _(scope.addFinalizerExit(finalizer));
          return scope;
        }),
      );
    }
  })();
}

/**
 * @tsplus fluent fncts.control.Scope.Closeable use
 */
export function use_<R, E, A>(
  self: Scope.Closeable,
  io: Lazy<IO<R & Has<Scope>, E, A>>,
): IO<R, E, A> {
  return self.extend(io).onExit((exit) => self.close(exit));
}
