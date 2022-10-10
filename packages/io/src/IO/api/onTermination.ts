/**
 * @tsplus pipeable fncts.io.IO onTermination
 */
export function onTermination<R1>(cleanup: (cause: Cause<never>) => URIO<R1, any>, __tsplusTrace?: string) {
  return <R, E, A>(self: Lazy<IO<R, E, A>>): IO<R | R1, E, A> => {
    return IO.unit.bracketExit(
      () => self(),
      (_, exit: Exit<E, A>) =>
        exit.match(
          (cause) => cause.failureOrCause.match(() => IO.unit, cleanup),
          () => IO.unit,
        ),
    );
  };
}
