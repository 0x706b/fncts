/**
 * Returns an IO that races this effect with the specified effect,
 * yielding the first result to complete, whether by success or failure. If
 * neither effect completes, then the composed effect will not complete.
 *
 * WARNING: The raced effect will safely interrupt the "loser", but will not
 * resume until the loser has been cleanly terminated. If early return is
 * desired, then instead of performing `l.raceFirst(r)`, perform
 * `l.disconnect raceFirst r.disconnect`, which disconnects left and right
 * interrupt signal, allowing a fast return, with interruption performed
 * in the background.
 *
 * @tsplus pipeable fncts.io.IO raceFirst
 */
export function raceFirst<R1, E1, A1>(that: IO<R1, E1, A1>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R | R1, E | E1, A | A1> => {
    return ma.result.race(that.result).flatMap((exit) => IO.fromExitNow<E | E1, A | A1>(exit));
  };
}
