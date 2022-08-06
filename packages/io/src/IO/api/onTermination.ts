/**
 * @tsplus fluent fncts.io.IO onTermination
 */
export function onTermination<R, E, A, R1>(
  self: Lazy<IO<R, E, A>>,
  cleanup: (cause: Cause<never>) => URIO<R1, any>,
  __tsplusTrace?: string,
): IO<R | R1, E, A> {
  return IO.unit.bracketExit(
    () => self(),
    (_, exit: Exit<E, A>) =>
      exit.match(
        (cause) => cause.failureOrCause.match(() => IO.unit, cleanup),
        () => IO.unit,
      ),
  );
}
