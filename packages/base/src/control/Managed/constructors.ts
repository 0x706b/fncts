import type { Cause } from "../../data/Cause";
import type { Exit } from "../../data/Exit";
import type { Lazy } from "../../data/function";
import type { URIO } from "../IO";
import type { Reservation } from "./Reservation";

import { identity, tuple } from "../../data/function";
import { FiberRef } from "../FiberRef";
import { IO } from "../IO";
import { Ref } from "../Ref";
import { Managed } from "./definition";
import { Finalizer } from "./Finalizer";

/**
 * Accesses the whole environment of the effect.
 *
 * @tsplus static fncts.control.ManagedOps ask
 */
export function ask<R>(): Managed<R, never, R> {
  return Managed.fromIO(IO.ask<R>());
}

/**
 * Lifts a `IO<R, E, A>` into `Managed<R, E, A>` with a release action.
 * The acquire and release actions will be performed uninterruptibly.
 *
 * @tsplus static fncts.control.ManagedOps bracket
 */
export function bracket_<R, E, A, R1>(
  acquire: IO<R, E, A>,
  release: (a: A) => IO<R1, never, unknown>,
): Managed<R & R1, E, A> {
  return Managed.bracketExit(acquire, release);
}

/**
 * Lifts a `IO<R, E, A>` into `Managed<R, E, A>` with a release action
 * that handles `Exit`. The acquire and release actions will be performed uninterruptibly.
 *
 * @tsplus static fncts.control.ManagedOps bracketExit
 */
export function bracketExit_<R, E, A, R1>(
  acquire: IO<R, E, A>,
  release: (a: A, exit: Exit<any, any>) => IO<R1, never, unknown>,
  __tsplusTrace?: string,
): Managed<R & R1, E, A> {
  return new Managed(
    IO.gen(function* (_) {
      const r               = yield* _(IO.ask<R1>());
      const releaseMap      = yield* _(FiberRef.currentReleaseMap.get);
      const a               = yield* _(acquire);
      const releaseMapEntry = yield* _(
        releaseMap.add(Finalizer.get((exit) => release(a, exit).give(r))),
      );
      return [releaseMapEntry, a] as const;
    }).uninterruptible,
  );
}

/**
 * @tsplus static fncts.control.ManagedOps fail
 */
export function fail<E = never, A = never>(
  e: Lazy<E>,
  __tsplusTrace?: string,
): Managed<unknown, E, A> {
  return Managed.fromIO(IO.fail(e));
}

/**
 * @tsplus static fncts.control.ManagedOps failNow
 */
export function failNow<E = never, A = never>(
  e: E,
  __tsplusTrace?: string,
): Managed<unknown, E, A> {
  return Managed.fromIO(IO.failNow(e));
}

/**
 * Returns a Managed that models failure with the specified `Cause`.
 *
 * @tsplus static fncts.control.ManagedOps failCause
 */
export function failCause<E = never, A = never>(cause: Lazy<Cause<E>>): Managed<unknown, E, A> {
  return Managed.fromIO(IO.failCause(cause));
}

/**
 * Returns a Managed that models failure with the specified `Cause`.
 *
 * @tsplus static fncts.control.ManagedOps failCauseNow
 */
export function failCauseNow<E = never, A = never>(cause: Cause<E>): Managed<unknown, E, A> {
  return Managed.fromIO(IO.failCauseNow(cause));
}

/**
 * Creates an effect that only executes the provided finalizer as its
 * release action.
 *
 * @tsplus static fncts.control.ManagedOps finalizer
 */
export function finalizer<R>(f: URIO<R, unknown>, __tsplusTrace?: string): Managed<R, never, void> {
  return finalizerExit(() => f);
}

/**
 * Creates an effect that only executes the provided function as its
 * release action.
 *
 * @tsplus static fncts.control.ManagedOps finalizerExit
 */
export function finalizerExit<R>(
  fin: (exit: Exit<unknown, unknown>) => URIO<R, unknown>,
  __tsplusTrace?: string,
): Managed<R, never, void> {
  return Managed.bracketExit(IO.unit, (_, exit) => fin(exit));
}

/**
 * Creates an IO that executes a finalizer stored in a `Ref`.
 * The `Ref` is yielded as the result of the effect, allowing for
 * control flows that require mutating finalizers.
 *
 * @tsplus static fncts.control.ManagedOps finalizerRef
 */
export function finalizerRef(initial: Finalizer): Managed<unknown, never, Ref<Finalizer>> {
  return Managed.bracketExit(Ref.make(initial), (ref, exit) =>
    ref.get.chain((f) => Finalizer.reverseGet(f)(exit)),
  );
}

/**
 * Lifts a `IO<R, E, A>` into `Managed<R, E, A>` with no release action. The
 * effect will be performed interruptibly.
 *
 * @tsplus static fncts.control.ManagedOps fromIO
 */
export function fromIO<R, E, A>(effect: IO<R, E, A>, __tsplusTrace?: string) {
  return new Managed(
    IO.uninterruptibleMask(({ restore }) => restore(effect).map((a) => tuple(Finalizer.noop, a))),
  );
}

/**
 * Lifts a pure `Reservation<R, E, A>` into `Managed<R, E, A>`. The acquisition step
 * is performed interruptibly.
 *
 * @tsplus static fncts.control.ManagedOps fromReservation
 */
export function fromReservation<R, E, A>(reservation: Reservation<R, E, A>): Managed<R, E, A> {
  return Managed.fromReservationIO(IO.succeedNow(reservation));
}

/**
 * Creates a `Managed` from a `Reservation` produced by an IO. Evaluating
 * the effect that produces the reservation will be performed *uninterruptibly*,
 * while the acquisition step of the reservation will be performed *interruptibly*.
 * The release step will be performed uninterruptibly as usual.
 *
 * This two-phase acquisition allows for resource acquisition flows that can be
 * safely interrupted and released.
 *
 * @tsplus static fncts.control.ManagedOps fromReservationIO
 */
export function fromReservationIO<R, E, R2, E2, A>(
  reservation: IO<R, E, Reservation<R2, E2, A>>,
): Managed<R & R2, E | E2, A> {
  return new Managed(
    IO.uninterruptibleMask(({ restore }) =>
      IO.gen(function* (_) {
        const r          = yield* _(IO.ask<R & R2>());
        const releaseMap = yield* _(FiberRef.currentReleaseMap.get);
        const reserved   = yield* _(reservation);
        const releaseKey = yield* _(
          releaseMap.addIfOpen(Finalizer.get((fin) => reserved.release(fin).give(r))),
        );
        const finalizerAndA = yield* _(
          IO.defer(
            releaseKey.match(
              () => IO.interrupt,
              (key) =>
                restore(reserved.acquire).map((a): readonly [Finalizer, A] => [
                  Finalizer.get((exit) => releaseMap.release(key, exit)),
                  a,
                ]),
            ),
          ),
        );
        return finalizerAndA;
      }),
    ),
  );
}

/**
 * Lifts a `IO<R, E, A>` into `Managed<R, E, A>` with no release action. The
 * effect will be performed uninterruptibly.
 *
 * @tsplus static fncts.control.ManagedOps fromIOUninterruptible
 */
export function fromIOUninterruptible<R, E, A>(effect: IO<R, E, A>): Managed<R, E, A> {
  return Managed.fromIO(effect.uninterruptible);
}

/**
 * Returns a Managed that halts with the specified error
 *
 * @tsplus static fncts.control.ManagedOps halt
 */
export function halt(e: Lazy<unknown>): Managed<unknown, never, never> {
  return Managed.fromIO(IO.halt(e));
}

/**
 * Returns a Managed that halts with the specified error
 *
 * @tsplus static fncts.control.ManagedOps haltNow
 */
export function haltNow(e: unknown): Managed<unknown, never, never> {
  return Managed.fromIO(IO.haltNow(e));
}

/**
 * Imports a synchronous side-effect into a Managed
 *
 * @tsplus static fncts.control.ManagedOps succeed
 */
export function succeed<E = never, A = never>(
  a: Lazy<A>,
  __tsplusTrace?: string,
): Managed<unknown, E, A> {
  return Managed.fromIO(IO.succeed(a));
}

/**
 * Imports a pure value into a `Managed`
 *
 * @tsplus static fncts.control.ManagedOps succeedNow
 */
export function succeedNow<E = never, A = never>(
  a: A,
  __tsplusTrace?: string,
): Managed<unknown, E, A> {
  return Managed.fromIO(IO.succeedNow(a));
}

/**
 * @tsplus static fncts.control.ManagedOps try
 */
export function try_<A>(effect: Lazy<A>): Managed<unknown, unknown, A> {
  return Managed.fromIO(IO.tryCatch(effect, identity));
}

/**
 * Imports a synchronous side-effect that may throw into a `Managed`
 *
 * @tsplus static fncts.control.ManagedOps tryCatch
 */
export function tryCatch_<E, A>(
  thunk: Lazy<A>,
  onThrow: (error: unknown) => E,
): Managed<unknown, E, A> {
  return Managed.fromIO(IO.tryCatch(thunk, onThrow));
}

/**
 * @tsplus static fncts.control.ManagedOps unit
 */
export const unit: Managed<unknown, never, void> = Managed.fromIO(IO.unit);
