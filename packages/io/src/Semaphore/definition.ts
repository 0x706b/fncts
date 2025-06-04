import { EitherTag } from "@fncts/base/data/Either";
import { IllegalArgumentError } from "@fncts/base/data/exceptions";
import { Reservation } from "@fncts/io/Semaphore/Reservation";

/**
 * @tsplus type fncts.io.Semaphore
 * @tsplus companion fncts.io.SemaphoreOps
 */
export class Semaphore {
  constructor(readonly permits: number) {}

  ref = Ref.unsafeMake<Either<ImmutableQueue<[Future<never, void>, number]>, number>>(Either.right(this.permits));

  available(__tsplusTrace?: string): UIO<number> {
    return this.ref.get.map((_) =>
      _.match(
        () => 0,
        (permits) => permits,
      ),
    );
  }

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

  releaseN(n: number, __tsplusTrace?: string): UIO<void> {
    const self = this;

    /**
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

  tryWithPermit<R, E, A>(io: IO<R, E, A>): IO<R, E, Maybe<A>> {
    return this.tryWithPermits(1)(io);
  }

  withPermits(permits: number) {
    return <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => {
      return IO.bracket(
        this.reserve(permits),
        (reservation) => reservation.acquire > io,
        (reservation) => reservation.release,
      );
    };
  }

  withPermit<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
    return this.withPermits(1)(io);
  }

  withPermitsScoped(permits: number) {
    return <R, E, A>(io: IO<R, E, A>): IO<Scope | R, E, A> => {
      return IO.acquireRelease(this.reserve(permits), (reservation) => reservation.release).flatMap(
        (reservation) => reservation.acquire > io,
      );
    };
  }

  withPermitScoped<R, E, A>(io: IO<R, E, A>): IO<Scope | R, E, A> {
    return this.withPermitsScoped(1)(io);
  }
}
