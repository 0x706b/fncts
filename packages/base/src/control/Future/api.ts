import type { Cause } from "../../data/Cause";
import type { Exit } from "../../data/Exit";
import type { FiberId } from "../../data/FiberId";
import type { Maybe } from "../../data/Maybe";
import type { Canceler, FIO, UIO } from "../IO";
import type { Future } from "./definition";

import { Either } from "../../data/Either";
import { Just, Nothing } from "../../data/Maybe";
import { IO } from "../IO";
import { Done, FutureStateTag, Pending } from "./definition";

/**
 * Exits the future with the specified exit, which will be propagated to all
 * fibers waiting on the value of the future.
 *
 * @tsplus fluent fncts.control.Future done
 */
export function done_<E, A>(future: Future<E, A>, exit: Exit<E, A>): UIO<boolean> {
  return future.fulfillWith(IO.fromExitNow(exit));
}

/**
 * Fails the future with the specified error, which will be propagated to all
 * fibers waiting on the value of the future.
 *
 * @tsplus fluent fncts.control.Future fail
 */
export function fail_<E, A>(future: Future<E, A>, e: E): UIO<boolean> {
  return future.fulfillWith(IO.failNow(e));
}

/**
 * Halts the future with the specified cause, which will be propagated to all
 * fibers waiting on the value of the future.
 *
 * @tsplus fluent fncts.control.Future failCause
 */
export function failCause_<E, A>(future: Future<E, A>, cause: Cause<E>): UIO<boolean> {
  return future.fulfillWith(IO.failCauseNow(cause));
}

/**
 * Completes the future with the result of the specified effect. If the
 * future has already been completed, the method will produce false.
 *
 * Note that `Future.completeWith` will be much faster, so consider using
 * that if you do not need to memoize the result of the specified effect.
 *
 * @tsplus fluent fncts.control.Future fulfill
 */
export function fulfill_<R, E, A>(future: Future<E, A>, io: IO<R, E, A>): IO<R, never, boolean> {
  return IO.uninterruptibleMask(({ restore }) =>
    restore(io).result.chain((exit) => future.done(exit)),
  );
}

/**
 * Completes the future with the specified effect. If the future has
 * already been completed, the method will produce false.
 *
 * Note that since the future is completed with an IO, the effect will
 * be evaluated each time the value of the future is retrieved through
 * combinators such as `wait`, potentially producing different results if
 * the effect produces different results on subsequent evaluations. In this
 * case te meaning of the "exactly once" guarantee of `Future` is that the
 * future can be completed with exactly one effect. For a version that
 * completes the future with the result of an IO see
 * `Future.complete`.
 *
 * @tsplus fluent fncts.control.Future fulfillWith
 */
export function fulfillWith_<E, A>(future: Future<E, A>, io: FIO<E, A>): UIO<boolean> {
  return IO.succeed(() => {
    switch (future.state._tag) {
      case FutureStateTag.Done: {
        return false;
      }
      case FutureStateTag.Pending: {
        const state  = future.state;
        future.state = new Done(io);
        state.joiners.reverse.forEach((f) => {
          f(io);
        });
        return true;
      }
    }
  });
}

/**
 * Kills the future with the specified error, which will be propagated to all
 * fibers waiting on the value of the future.
 *
 * @tsplus fluent fncts.control.Future halt
 */
export function halt_<E, A>(future: Future<E, A>, defect: unknown): UIO<boolean> {
  return future.fulfillWith(IO.haltNow(defect));
}

/**
 * Completes the future with interruption. This will interrupt all fibers
 * waiting on the value of the future as by the fiber calling this method.
 *
 * @tsplus getter fncts.control.Future interrupt
 */
export function interrupt<E, A>(future: Future<E, A>): UIO<boolean> {
  return IO.fiberId.chain((id) => future.fulfillWith(IO.interruptAs(id)));
}

/**
 * Completes the future with interruption. This will interrupt all fibers
 * waiting on the value of the future as by the specified fiber.
 *
 * @tsplus fluent fncts.control.Future interruptAs
 */
export function interruptAs_<E, A>(future: Future<E, A>, id: FiberId): UIO<boolean> {
  return future.fulfillWith(IO.interruptAs(id));
}

/**
 * Checks for completion of this Future. Produces true if this future has
 * already been completed with a value or an error and false otherwise.
 *
 * @tsplus getter fncts.control.Future isDone
 */
export function isDone<E, A>(future: Future<E, A>): UIO<boolean> {
  return IO.succeed(future.state._tag === FutureStateTag.Done);
}

/**
 * Checks for completion of this Future. Returns the result effect if this
 * future has already been completed or a `None` otherwise.
 *
 * @tsplus getter fncts.control.Future poll
 */
export function poll<E, A>(future: Future<E, A>): UIO<Maybe<FIO<E, A>>> {
  return IO.succeed(() => {
    switch (future.state._tag) {
      case FutureStateTag.Done: {
        return Just(future.state.value);
      }
      case FutureStateTag.Pending: {
        return Nothing();
      }
    }
  });
}

/**
 * Completes the future with the specified value.
 *
 * @tsplus fluent fncts.control.Future succeed
 */
export function succeed_<A, E>(future: Future<E, A>, a: A) {
  return future.fulfillWith(IO.succeedNow(a));
}

/**
 * Retrieves the value of the future, suspending the fiber running the action
 * until the result is available.
 *
 * @tsplus fluent fncts.control.Future unsafeDone
 */
export function unsafeDone_<E, A>(future: Future<E, A>, io: FIO<E, A>) {
  if (future.state._tag === FutureStateTag.Pending) {
    const state  = future.state;
    future.state = new Done(io);
    state.joiners.reverse.forEach((f) => {
      f(io);
    });
  }
}

/**
 * @tsplus fluent fncts.control.Future unsafeSucceed
 */
export function unsafeSucceed_<A>(future: Future<never, A>, a: A): void {
  future.unsafeDone(IO.succeedNow(a));
}

/**
 * Retrieves the value of the future, suspending the fiber running the action
 * until the result is available.
 *
 * @tsplus getter fncts.control.Future await
 */
export function wait<E, A>(future: Future<E, A>): IO<unknown, E, A> {
  return IO.asyncInterrupt<unknown, E, A>((k) => {
    switch (future.state._tag) {
      case FutureStateTag.Done: {
        return Either.right(future.state.value);
      }
      case FutureStateTag.Pending: {
        future.state = new Pending(future.state.joiners.prepend(k));
        return Either.left(interruptJoiner(future, k));
      }
    }
  }, future.blockingOn);
}

function interruptJoiner<E, A>(
  future: Future<E, A>,
  joiner: (a: FIO<E, A>) => void,
): Canceler<unknown> {
  return IO.succeed(() => {
    switch (future.state._tag) {
      case FutureStateTag.Pending: {
        future.state = new Pending(future.state.joiners.filter((j) => j !== joiner));
        break;
      }
      case FutureStateTag.Done: {
        break;
      }
    }
  });
}

// codegen:start { preset: pipeable }
/**
 * Exits the future with the specified exit, which will be propagated to all
 * fibers waiting on the value of the future.
 * @tsplus dataFirst done_
 */
export function done<E, A>(exit: Exit<E, A>) {
  return (future: Future<E, A>): UIO<boolean> => done_(future, exit);
}
/**
 * Fails the future with the specified error, which will be propagated to all
 * fibers waiting on the value of the future.
 * @tsplus dataFirst fail_
 */
export function fail<E>(e: E) {
  return <A>(future: Future<E, A>): UIO<boolean> => fail_(future, e);
}
/**
 * Halts the future with the specified cause, which will be propagated to all
 * fibers waiting on the value of the future.
 * @tsplus dataFirst failCause_
 */
export function failCause<E>(cause: Cause<E>) {
  return <A>(future: Future<E, A>): UIO<boolean> => failCause_(future, cause);
}
/**
 * Completes the future with the result of the specified effect. If the
 * future has already been completed, the method will produce false.
 *
 * Note that `Future.completeWith` will be much faster, so consider using
 * that if you do not need to memoize the result of the specified effect.
 * @tsplus dataFirst fulfill_
 */
export function fulfill<R, E, A>(io: IO<R, E, A>) {
  return (future: Future<E, A>): IO<R, never, boolean> => fulfill_(future, io);
}
/**
 * Completes the future with the specified effect. If the future has
 * already been completed, the method will produce false.
 *
 * Note that since the future is completed with an IO, the effect will
 * be evaluated each time the value of the future is retrieved through
 * combinators such as `wait`, potentially producing different results if
 * the effect produces different results on subsequent evaluations. In this
 * case te meaning of the "exactly once" guarantee of `Future` is that the
 * future can be completed with exactly one effect. For a version that
 * completes the future with the result of an IO see
 * `Future.complete`.
 * @tsplus dataFirst fulfillWith_
 */
export function fulfillWith<E, A>(io: FIO<E, A>) {
  return (future: Future<E, A>): UIO<boolean> => fulfillWith_(future, io);
}
/**
 * Kills the future with the specified error, which will be propagated to all
 * fibers waiting on the value of the future.
 * @tsplus dataFirst halt_
 */
export function halt(defect: unknown) {
  return <E, A>(future: Future<E, A>): UIO<boolean> => halt_(future, defect);
}
/**
 * Completes the future with interruption. This will interrupt all fibers
 * waiting on the value of the future as by the specified fiber.
 * @tsplus dataFirst interruptAs_
 */
export function interruptAs(id: FiberId) {
  return <E, A>(future: Future<E, A>): UIO<boolean> => interruptAs_(future, id);
}
/**
 * Completes the future with the specified value.
 * @tsplus dataFirst succeed_
 */
export function succeed<A>(a: A) {
  return <E>(future: Future<E, A>) => succeed_(future, a);
}
/**
 * Retrieves the value of the future, suspending the fiber running the action
 * until the result is available.
 * @tsplus dataFirst unsafeDone_
 */
export function unsafeDone<E, A>(io: FIO<E, A>) {
  return (future: Future<E, A>) => unsafeDone_(future, io);
}
/**
 * @tsplus dataFirst unsafeSucceed_
 */
export function unsafeSucceed<A>(a: A) {
  return (future: Future<never, A>): void => unsafeSucceed_(future, a);
}
// codegen:end
