/**
 * @tsplus static fncts.io.FiberOps done
 */
export function done<E, A>(exit: Exit<E, A>): Fiber.Synthetic<E, A> {
  return {
    _tag: "SyntheticFiber",
    await: IO.succeed(exit),
    inheritRefs: IO.unit,
    interruptAs: () => IO.succeed(exit),
    poll: IO.succeed(Just(exit)),
  };
}

/**
 * @tsplus static fncts.io.FiberOps fail
 */
export function fail<E>(e: E): Fiber.Synthetic<E, never> {
  return done(Exit.fail(e));
}

/**
 * @tsplus static fncts.io.FiberOps failCause
 */
export function failCause<E>(cause: Cause<E>): Fiber.Synthetic<E, never> {
  return done(Exit.failCause(cause));
}

/**
 * @tsplus static fncts.io.FiberOps interruptAs
 */
export function interruptAs(id: FiberId): Fiber.Synthetic<never, never> {
  return done(Exit.interrupt(id));
}

/**
 * @tsplus static fncts.io.FiberOps succeed
 */
export function succeed<A>(a: A): Fiber.Synthetic<never, A> {
  return done(Exit.succeed(a));
}
