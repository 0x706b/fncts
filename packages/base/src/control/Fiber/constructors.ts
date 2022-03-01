import type { Cause } from "../../data/Cause";
import type { FiberId } from "../../data/FiberId";
import type { Fiber } from "./definition";

import { Exit } from "../../data/Exit";
import { Just } from "../../data/Maybe";
import { IO } from "../IO";

/**
 * @tsplus static fncts.control.FiberOps done
 */
export function done<E, A>(exit: Exit<E, A>): Fiber.Synthetic<E, A> {
  return {
    _tag: "SyntheticFiber",
    await: IO.succeed(exit),
    getRef: (ref) => IO.succeed(ref.initial),
    inheritRefs: IO.unit,
    interruptAs: () => IO.succeed(exit),
    poll: IO.succeed(Just(exit)),
  };
}

/**
 * @tsplus static fncts.control.FiberOps fail
 */
export function fail<E>(e: E): Fiber.Synthetic<E, never> {
  return done(Exit.fail(e));
}

/**
 * @tsplus static fncts.control.FiberOps failCause
 */
export function failCause<E>(cause: Cause<E>): Fiber.Synthetic<E, never> {
  return done(Exit.failCause(cause));
}

/**
 * @tsplus static fncts.control.FiberOps interruptAs
 */
export function interruptAs(id: FiberId): Fiber.Synthetic<never, never> {
  return done(Exit.interrupt(id));
}

/**
 * @tsplus static fncts.control.FiberOps succeed
 */
export function succeed<A>(a: A): Fiber.Synthetic<never, A> {
  return done(Exit.succeed(a));
}