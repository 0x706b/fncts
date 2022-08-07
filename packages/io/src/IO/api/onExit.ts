/**
 * @tsplus fluent fncts.io.IO onExit
 */
export function onExit_<R, E, A, R1, E1>(
  self: IO<R, E, A>,
  cleanup: (exit: Exit<E, A>) => IO<R1, E1, any>,
  __tsplusTrace?: string,
): IO<R | R1, E | E1, A> {
  return IO.unit.bracketExit(
    () => self,
    (_, exit) => cleanup(exit),
  );
}
