/**
 * @tsplus type fncts.io.Semaphore
 * @tsplus companion fncts.io.SemaphoreOps
 */
export class Semaphore {
  constructor(readonly permits: number) {}

  taken   = 0;
  waiters = new Set<() => void>();

  get free(): number {
    return this.permits - this.taken;
  }

  runNext() {
    const next = this.waiters.values().next();
    if (!next.done) {
      this.waiters.delete(next.value);
      next.value();
    }
  }

  take(n: number) {
    return IO.asyncInterrupt<never, never, number>((cb) => {
      if (this.free < n) {
        const observer = () => {
          if (this.free >= n) {
            this.waiters.delete(observer);
            this.taken += n;
            cb(IO.succeedNow(n));
          }
        };
        this.waiters.add(observer);
        return Either.left(
          IO(() => {
            this.waiters.delete(observer);
          }),
        );
      }
      this.taken += n;
      return Either.right(IO.succeedNow(n));
    });
  }

  release(n: number) {
    return IO.withFiberRuntime<never, never, void>((fiber) => {
      this.taken -= n;
      fiber.getFiberRef(FiberRef.currentScheduler).scheduleTask(() => {
        this.waiters.forEach((wake) => wake());
      });
      return IO.unit;
    });
  }

  withPermits(permits: number) {
    return <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => {
      return IO.uninterruptibleMask((restore) =>
        restore(this.take(permits)).flatMap((permits) => restore(io).ensuring(this.release(permits))),
      );
    };
  }

  withPermit<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
    return this.withPermits(1)(io);
  }
}

/**
 * @tsplus static fncts.io.SemaphoreOps unsafeMake
 */
export function unsafeMakeSemaphore(permits: number): Semaphore {
  return new Semaphore(permits);
}

/**
 * @tsplus static fncts.io.SemaphoreOps make
 * @tsplus static fncts.io.SemaphoreOps __call
 */
export function makeSemaphore(permits: number, __tsplusTrace?: string): UIO<Semaphore> {
  return IO(Semaphore.unsafeMake(permits));
}
