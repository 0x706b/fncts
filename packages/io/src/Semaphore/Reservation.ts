/**
 * @tsplus type fncts.io.Semaphore.Reservation
 * @tsplus companion fncts.io.Semaphore.ReservationOps
 */
export class Reservation {
  constructor(
    readonly acquire: UIO<void>,
    readonly release: UIO<void>,
  ) {}
}

/**
 * @tsplus static fncts.io.Semaphore.ReservationOps zero
 */
export const zero = new Reservation(IO.unit, IO.unit);
