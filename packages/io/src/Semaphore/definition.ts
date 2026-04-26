import { EitherTag } from "@fncts/base/data/Either";
import { IllegalArgumentError } from "@fncts/base/data/exceptions";
import { Reservation } from "@fncts/io/Semaphore/Reservation";

/**
 *
 * @tsplus type fncts.io.Semaphore
 *
 * @tsplus companion fncts.io.SemaphoreOps
 */
export class Semaphore {
  constructor(readonly permits: number) {}

  ref = Ref.unsafeMake<Either<ImmutableQueue<[Future<never, void>, number]>, number>>(Either.right(this.permits));

  /** Returns `0` when there are queued waiters, otherwise returns currently free permits. */
  available(__tsplusTrace?: string): UIO<number> {
    return this.ref.get.map((_) =>
      _.match(
        () => 0,
        (permits) => permits,
      ),
    );
  }

  /** Attempts to reserve `n` permits immediately, returning `Nothing` when not enough are available. */
  tryReserve(n: number, __tsplusTrace?: string): UIO<Maybe<Reservation>> {
    if (n < 0) {
      return IO.halt(new IllegalArgumentError(`Unexpected negative ${n} permits requested`, "Semaphore.tryReserve"));
    } else if (n === 0) {
      return IO.succeedNow(Just(Reservation.zero));
    } else {
      return this.ref.modify((state) =>
        state.match(
          () => [Nothing(), state],
          (permits) => {
            if (permits >= n) {
              return [Just(new Reservation(IO.unit, this.releaseN(n))), Either.right(permits - n)];
            } else {
              return [Nothing(), state];
            }
          },
        ),
      );
    }
  }

  /** Reserves `n` permits, suspending on a queue until enough permits can be acquired. */
  reserve(n: number, __tsplusTrace?: string): UIO<Reservation> {
    if (n < 0) {
      return IO.halt(new IllegalArgumentError(`Unexpected negative ${n} permits requested`, "Semaphore.reserve"));
    } else if (n === 0) {
      return IO.succeedNow(Reservation.zero);
    } else {
      return Future.make<never, void>().flatMap((future) =>
        this.ref.modify((state) =>
          state.match(
            (queue) => [
              new Reservation(future.await, this.restore(future, n)),
              Either.left(queue.enqueue([future, n])),
            ],
            (permits) => {
              if (permits >= n) {
                return [new Reservation(IO.unit, this.releaseN(n)), Either.right(permits - n)];
              } else {
                return [
                  new Reservation(future.await, this.restore(future, n)),
                  Either.left(ImmutableQueue.single([future, n - permits])),
                ];
              }
            },
          ),
        ),
      );
    }
  }

  /** Cancels a pending reservation and releases any already-accounted permits back to the semaphore. */
  restore(future: Future<never, void>, n: number, __tsplusTrace?: string): UIO<void> {
    return this.ref.modify((state) =>
      state.match(
        (queue) =>
          queue
            .find(([waiter]) => waiter === future)
            .match(
              () => [this.releaseN(n), Either.left(queue)],
              ([_, permits]) => [
                this.releaseN(n - permits),
                Either.left(queue.filter(([waiter]) => waiter !== future)),
              ],
            ),
        (permits) => [IO.unit, Either.right(permits + n)],
      ),
    ).flatten;
  }

  /** Releases `n` permits, waking queued waiters in order while accounting for partial fulfillment. */
  releaseN(n: number, __tsplusTrace?: string): UIO<void> {
    const self = this;

    /**
     *
     * @tsplus tailRec
     */
    function loop(
      n: number,
      state: Either<ImmutableQueue<[Future<never, any>, number]>, number>,
      acc: UIO<void>,
    ): [UIO<void>, Either<ImmutableQueue<[Future<never, any>, number]>, number>] {
      state.concrete();
      switch (state._tag) {
        case EitherTag.Right: {
          return [acc, Either.right(state.right + n)];
        }
        case EitherTag.Left: {
          const waiter = state.left.dequeue;

          Maybe.concrete(waiter);

          switch (waiter._tag) {
            case MaybeTag.Nothing: {
              return [acc, Either.right(self.permits)];
            }
            case MaybeTag.Just: {
              const [[future, permits], queue] = waiter.value;
              if (n > permits) {
                return loop(n - permits, Either.left(queue), acc.zipLeft(future.succeed(undefined)));
              } else if (n === permits) {
                return [acc.zipRight(future.succeed().asUnit), Either.left(queue)];
              } else {
                return [acc, Either.left(queue.prepend([future, permits - n]))];
              }
            }
          }
        }
      }
    }

    return this.ref.modify((state) => loop(n, state, IO.unit)).flatten;
  }

  /** Runs an effect only if `permits` can be reserved immediately, otherwise returns `Nothing`. */
  tryWithPermits(permits: number) {
    return <R, E, A>(io: IO<R, E, A>, __tsPlusTrace?: string): IO<R, E, Maybe<A>> => {
      return this.tryReserve(permits).bracket(
        (r) =>
          r.match(
            () => IO.nothing,
            () => io.asJust,
          ),
        (r) =>
          r.match(
            () => Exit.unit,
            (reservation) => reservation.release,
          ),
      );
    };
  }

  /** Variant of `tryWithPermits` for a single permit. */
  tryWithPermit<R, E, A>(io: IO<R, E, A>): IO<R, E, Maybe<A>> {
    return this.tryWithPermits(1)(io);
  }

  /** Brackets an effect with acquisition and release of `permits`, waiting if needed. */
  withPermits(permits: number) {
    return <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => {
      return IO.bracket(
        this.reserve(permits),
        (reservation) => reservation.acquire > io,
        (reservation) => reservation.release,
      );
    };
  }

  /** Variant of `withPermits` for a single permit. */
  withPermit<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
    return this.withPermits(1)(io);
  }

  /** Acquires `permits` for the lifetime of the surrounding scope. */
  withPermitsScoped(permits: number) {
    return <R, E, A>(io: IO<R, E, A>): IO<Scope | R, E, A> => {
      return IO.acquireRelease(this.reserve(permits), (reservation) => reservation.release).flatMap(
        (reservation) => reservation.acquire > io,
      );
    };
  }

  /** Variant of `withPermitsScoped` for a single permit. */
  withPermitScoped<R, E, A>(io: IO<R, E, A>): IO<Scope | R, E, A> {
    return this.withPermitsScoped(1)(io);
  }
}
