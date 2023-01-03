/**
 * @tsplus type fncts.io.Semaphore
 * @tsplus companion fncts.io.SemaphoreOps
 */
export class Semaphore {
  constructor(readonly leases: number) {}

  running   = 0;
  observers = new Set<() => void>();

  runNext() {
    const next = this.observers.values().next();
    if (!next.done) {
      this.observers.delete(next.value);
      next.value();
    }
  }

  withPermits(permits: number) {
    return <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => {
      return IO.asyncInterrupt<R, E, A>((cb) => {
        const finalized =
          IO((this.running += permits)) >
          io.ensuring(
            IO(() => {
              this.running = this.running - permits;
              this.runNext();
            }),
          );

        if (this.running + permits <= this.leases) {
          return Either.right(finalized);
        } else {
          let interrupted = false;
          const observer  = () => {
            if (!interrupted) {
              cb(finalized);
            } else {
              this.runNext();
            }
          };
          this.observers.add(observer);
          return Either.left(
            IO(() => {
              interrupted = true;
              this.observers.delete(observer);
            }),
          );
        }
      });
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
