import type { Exit } from "../../../data/Exit.js";
import type { IO } from "../../IO.js";

/**
 * A `Reservation<R, E, A>` encapsulates resource acquisition and disposal
 * without specifying when or how that resource might be used.
 *
 * @tsplus type fncts.control.Managed.Reservation
 * @tsplus companion fncts.control.Managed.ReservationOps
 */
export class Reservation<R, E, A> {
  constructor(
    readonly acquire: IO<R, E, A>,
    readonly release: (exit: Exit<any, any>) => IO<R, never, any>,
  ) {}
}

/**
 * @tsplus static fncts.control.Managed.ReservationOps make
 */
export function make<R, E, A>(
  acquire: IO<R, E, A>,
  release: (exit: Exit<any, any>) => IO<R, never, any>,
): Reservation<R, E, A> {
  return new Reservation(acquire, release);
}
