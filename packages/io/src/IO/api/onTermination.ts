/**
 * @tsplus pipeable fncts.io.IO onTermination
 */
export function onTermination<R1>(cleanup: (cause: Cause<never>) => URIO<R1, any>, __tsplusTrace?: string) {
  return <R, E, A>(self: Lazy<IO<R, E, A>>): IO<R | R1, E, A> => {
    return IO.defer(self).onExit((exit) =>
      exit.match(
        (cause) => {
          if (cause.isFailure) return IO.unit;
          else return cleanup(cause as Cause<never>);
        },
        () => IO.unit,
      ),
    );
  };
}
