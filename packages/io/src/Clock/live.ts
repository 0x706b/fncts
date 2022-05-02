class LiveClock extends Clock {
  currentTime: UIO<number> = IO.succeed(Date.now());

  sleep(duration: Lazy<number>, __tsplusTrace?: string): UIO<void> {
    return IO.asyncInterrupt<unknown, never, void>((k) => {
      const handle = setTimeout(() => {
        k(IO.unit);
      }, duration());
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
