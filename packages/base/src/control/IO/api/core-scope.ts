import type { Exit } from "../../../data/Exit";
import type { Maybe } from "../../../data/Maybe";
import type { Fiber, RuntimeFiber } from "../../Fiber";
import type { UIO, URIO } from "../definition";

import { Just, Nothing } from "../../../data/Maybe";
import { Scope } from "../../Scope";
import { Fork, GetForkScope, IO, OverrideForkScope, Race } from "../definition";

/**
 * Retrieves the scope that will be used to supervise forked effects.
 *
 * @tsplus static fncts.control.IOOps forkScope
 */
export const forkScope: UIO<Scope> = new GetForkScope(IO.succeedNow);

/**
 * Retrieves the scope that will be used to supervise forked effects.
 *
 * @tsplus static fncts.control.IOOps forkScopeWith
 */
export function forkScopeWith<R, E, A>(f: (_: Scope) => IO<R, E, A>, __tsplusTrace?: string) {
  return new GetForkScope(f, __tsplusTrace);
}

export class ForkScopeRestore {
  constructor(private scope: Scope) {}

  readonly restore = <R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> =>
    new OverrideForkScope(ma, Just(this.scope), __tsplusTrace);
}

/**
 * Captures the fork scope, before overriding it with the specified new
 * scope, passing a function that allows restoring the fork scope to
 * what it was originally.
 *
 * @tsplus static fncts.control.IOOps forkScopeMask
 */
export function forkScopeMask_<R, E, A>(
  newScope: Scope,
  f: (restore: ForkScopeRestore) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.forkScopeWith(
    (scope) => new OverrideForkScope(f(new ForkScopeRestore(scope)), Just(newScope), __tsplusTrace),
  );
}

/**
 * Returns an effect that forks this effect into its own separate fiber,
 * returning the fiber immediately, without waiting for it to begin
 * executing the effect.
 *
 * The returned fiber can be used to interrupt the forked fiber, await its
 * result, or join the fiber. See `Fiber` for more information.
 *
 * The fiber is forked with interrupt supervision mode, meaning that when the
 * fiber that forks the child exits, the child will be interrupted.
 *
 * @tsplus fluent fncts.control.IO forkIn
 */
export function forkIn_<R, E, A>(
  io: IO<R, E, A>,
  scope: Scope,
  __tsplusTrace?: string,
): URIO<R, RuntimeFiber<E, A>> {
  return new Fork(io, Just(scope), __tsplusTrace);
}

/**
 * Returns an effect that races this effect with the specified effect, calling
 * the specified finisher as soon as one result or the other has been computed.
 *
 * @tsplus fluent fncts.control.IO raceWith
 */
export function raceWith_<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3>(
  left: IO<R, E, A>,
  right: IO<R1, E1, A1>,
  leftWins: (exit: Exit<E, A>, fiber: Fiber<E1, A1>) => IO<R2, E2, A2>,
  rightWins: (exit: Exit<E1, A1>, fiber: Fiber<E, A>) => IO<R3, E3, A3>,
  scope: Maybe<Scope> = Nothing(),
  __tsplusTrace?: string,
): IO<R & R1 & R2 & R3, E2 | E3, A2 | A3> {
  return new Race(left, right, leftWins, rightWins, scope, __tsplusTrace);
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
 * @tsplus static fncts.control.IOOps transplant
 */
export function transplant<R, E, A>(
  f: (_: Grafter) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return forkScopeWith((scope) => f((e) => new OverrideForkScope(e, Just(scope))));
}

/**
 * Forks the effect into a new fiber attached to the global scope. Because the
 * new fiber is attached to the global scope, when the fiber executing the
 * returned effect terminates, the forked fiber will continue running.
 *
 * @tsplus getter fncts.control.IO forkDaemon
 */
export function forkDaemon<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string,
): URIO<R, RuntimeFiber<E, A>> {
  return ma.forkIn(Scope.global);
}

/**
 * Returns a new effect that will utilize the specified scope to supervise
 * any fibers forked within the original effect.
 *
 * @tsplus fluent fncts.control.IO overrideForkScope
 */
export function overrideForkScope_<R, E, A>(
  ma: IO<R, E, A>,
  scope: Scope,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return new OverrideForkScope(ma, Just(scope), __tsplusTrace);
}

/**
 * Returns a new effect that will utilize the default scope (fiber scope) to
 * supervise any fibers forked within the original effect.
 *
 * @tsplus getter fncts.control.IO defaultForkScope
 */
export function defaultForkScope<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return new OverrideForkScope(ma, Nothing(), __tsplusTrace);
}
