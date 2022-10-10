/**
 * @tsplus pipeable fncts.io.IO onExit
 */
export function onExit<E, A, R1, E1>(cleanup: (exit: Exit<E, A>) => IO<R1, E1, any>, __tsplusTrace?: string) {
  return <R>(self: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return IO.unit.bracketExit(
      () => self,
      (_, exit) => cleanup(exit),
    );
  };
}
