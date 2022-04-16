import { ExitTag } from "@fncts/base/data/Exit.js";

import { FiberScope } from "../../FiberScope.js";
import { Fork, GetForkScope, IO, OverrideForkScope, Race } from "../definition.js";

/**
 * @tsplus getter fncts.io.IO daemonChildren
 */
export function daemonChildren<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IO.defer(new OverrideForkScope(self, Just(FiberScope.global), __tsplusTrace));
}

/**
 * Retrieves the scope that will be used to supervise forked effects.
 *
 * @tsplus static fncts.io.IOOps forkScope
 */
export const forkScope: UIO<FiberScope> = new GetForkScope(IO.succeedNow);

/**
 * Retrieves the scope that will be used to supervise forked effects.
 *
 * @tsplus static fncts.io.IOOps forkScopeWith
 */
export function forkScopeWith<R, E, A>(f: (_: FiberScope) => IO<R, E, A>, __tsplusTrace?: string) {
  return new GetForkScope(f, __tsplusTrace);
}

export class ForkScopeRestore {
  constructor(private scope: FiberScope) {}

  readonly restore = <R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> =>
    new OverrideForkScope(ma, Just(this.scope), __tsplusTrace);
}

/**
 * Captures the fork scope, before overriding it with the specified new
 * scope, passing a function that allows restoring the fork scope to
 * what it was originally.
 *
 * @tsplus static fncts.io.IOOps forkScopeMask
 */
export function forkScopeMask_<R, E, A>(
  newScope: FiberScope,
  f: (restore: ForkScopeRestore) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.forkScopeWith(
    (scope) => new OverrideForkScope(f(new ForkScopeRestore(scope)), Just(newScope), __tsplusTrace),
  );
}

/**
 * Returns an effect that races this effect with the specified effect, calling
 * the specified finisher as soon as one result or the other has been computed.
 *
 * @tsplus fluent fncts.io.IO raceWith
 */
export function raceWith_<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3>(
  left: IO<R, E, A>,
  right: Lazy<IO<R1, E1, A1>>,
  leftWins: (exit: Exit<E, A>, fiber: Fiber<E1, A1>) => IO<R2, E2, A2>,
  rightWins: (exit: Exit<E1, A1>, fiber: Fiber<E, A>) => IO<R3, E3, A3>,
  __tsplusTrace?: string,
): IO<R & R1 & R2 & R3, E2 | E3, A2 | A3> {
  return IO.defer(
    () =>
      new Race(
        left,
        right(),
        (winner, loser) =>
          winner.await.flatMap((exit) => {
            switch (exit._tag) {
              case ExitTag.Success:
                return winner.inheritRefs.flatMap(() => leftWins(exit, loser));
              case ExitTag.Failure:
                return leftWins(exit, loser);
            }
          }),
        (winner, loser) =>
          winner.await.flatMap((exit) => {
            switch (exit._tag) {
              case ExitTag.Success:
                return winner.inheritRefs.flatMap(() => rightWins(exit, loser));
              case ExitTag.Failure:
                return rightWins(exit, loser);
            }
          }),
      ),
  );
}

export type Grafter = <R, E, A>(effect: IO<R, E, A>) => IO<R, E, A>;

/**
 * Transplants specified effects so that when those effects fork other
 * effects, the forked effects will be governed by the scope of the
 * fiber that executes this effect.
 *
 * This can be used to "graft" deep grandchildren onto a higher-level
 * scope, effectively extending their lifespans into the parent scope.
 *
 * @tsplus static fncts.io.IOOps transplant
 */
export function transplant<R, E, A>(f: (_: Grafter) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return forkScopeWith((scope) => f((e) => new OverrideForkScope(e, Just(scope))));
}

/**
 * Forks the effect into a new fiber attached to the global scope. Because the
 * new fiber is attached to the global scope, when the fiber executing the
 * returned effect terminates, the forked fiber will continue running.
 *
 * @tsplus getter fncts.io.IO forkDaemon
 */
export function forkDaemon<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): URIO<R, Fiber.Runtime<E, A>> {
  return new Fork(ma, Just(FiberScope.global), __tsplusTrace);
}

/**
 * Returns a new effect that will utilize the specified scope to supervise
 * any fibers forked within the original effect.
 *
 * @tsplus fluent fncts.io.IO overrideForkScope
 */
export function overrideForkScope_<R, E, A>(ma: IO<R, E, A>, scope: FiberScope, __tsplusTrace?: string): IO<R, E, A> {
  return new OverrideForkScope(ma, Just(scope), __tsplusTrace);
}

/**
 * Returns a new effect that will utilize the default scope (fiber scope) to
 * supervise any fibers forked within the original effect.
 *
 * @tsplus getter fncts.io.IO defaultForkScope
 */
export function defaultForkScope<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return new OverrideForkScope(ma, Nothing(), __tsplusTrace);
}
