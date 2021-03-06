/**
 * @tsplus fluent fncts.io.IO timeoutTo
 */
export function timeoutTo<R, E, A, B, B1>(
  self: IO<R, E, A>,
  duration: Lazy<Duration>,
  b: Lazy<B>,
  f: (a: A) => B1,
  __tsplusTrace?: string,
): IO<R, E, B | B1> {
  return self.map(f).raceFirst(IO.sleep(duration).interruptible.as(b));
}

/**
 * @tsplus fluent fncts.io.IO timeout
 */
export function timeout<R, E, A>(self: IO<R, E, A>, duration: Lazy<Duration>): IO<R, E, Maybe<A>> {
  return self.timeoutTo(duration, Nothing(), Maybe.just);
}
