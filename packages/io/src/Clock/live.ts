class LiveClock extends Clock {
  currentTime: UIO<number> = IO.succeed(Date.now());

  sleep(duration: Lazy<Duration>, __tsplusTrace?: string): UIO<void> {
    return IO.asyncInterrupt<never, never, void>((k) => {
      const handle = setTimeout(() => {
        k(IO.unit);
      }, duration().milliseconds);
      return Either.left(
        IO.succeed(() => {
          clearTimeout(handle);
        }),
      );
    });
  }
}

/**
 * @tsplus static fncts.io.ClockOps Live
 */
export const live: Clock = new LiveClock();
