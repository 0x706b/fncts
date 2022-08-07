import { SyntheticFiber } from "@fncts/io/Fiber/definition";

/**
 * @tsplus static fncts.io.FiberOps done
 */
export function done<E, A>(exit: Exit<E, A>, __tsplusTrace?: string): Fiber<E, A> {
  return new SyntheticFiber(
    FiberId.none,
    IO.succeedNow(exit),
    IO.succeedNow(Conc()),
    IO.unit,
    IO.succeedNow(Just(exit)),
    () => IO.succeedNow(exit),
  );
}

/**
 * @tsplus static fncts.io.FiberOps fail
 */
export function fail<E>(e: E, __tsplusTrace?: string): Fiber<E, never> {
  return done(Exit.fail(e));
}

/**
 * @tsplus static fncts.io.FiberOps failCause
 */
export function failCause<E>(cause: Cause<E>, __tsplusTrace?: string): Fiber<E, never> {
  return done(Exit.failCause(cause));
}

/**
 * @tsplus static fncts.io.FiberOps interruptAs
 */
export function interrupted(id: FiberId, __tsplusTrace?: string): Fiber<never, never> {
  return done(Exit.interrupt(id));
}

/**
 * @tsplus static fncts.io.FiberOps succeed
 */
export function succeed<A>(a: A, __tsplusTrace?: string): Fiber<never, A> {
  return done(Exit.succeed(a));
}
