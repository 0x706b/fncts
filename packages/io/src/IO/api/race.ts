/**
 * Returns an IO that races this effect with the specified effect,
 * returning the first successful `A` from the faster side. If one effect
 * succeeds, the other will be interrupted. If neither succeeds, then the
 * effect will fail with some error.
 *
 * WARNING: The raced effect will safely interrupt the "loser", but will not
 * resume until the loser has been cleanly terminated.
 *
 * @tsplus pipeable fncts.io.IO race
 */
export function race<R1, E1, A1>(that: IO<R1, E1, A1>) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E | E1, A | A1> => {
    return IO.checkInterruptible((status) => disconnect(self, status).raceAwait(disconnect(that, status)));
  };
}

function disconnect<R, E, A>(io: IO<R, E, A>, interruptStatus: InterruptStatus, __tsplusTrace?: string): IO<R, E, A> {
  if (interruptStatus.isInterruptible) return io.disconnect;
  else return io.uninterruptible.disconnect.interruptible;
}

/**
 * @tsplus pipeable fncts.io.IO raceAwait
 */
export function raceAwait<R1, E1, A1>(that: IO<R1, E1, A1>) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E | E1, A | A1> => {
    return IO.fiberIdWith((id) =>
      self.raceWith(
        that,
        (exit, right) =>
          exit.match(
            (cause) => right.join.mapErrorCause((c) => Cause.parallel(cause, c)),
            (a) => right.interruptAs(id).as(a),
          ),
        (exit, left) =>
          exit.match(
            (cause) => left.join.mapErrorCause((c) => Cause.parallel(cause, c)),
            (a1) => left.interruptAs(id).as(a1),
          ),
      ),
    );
  };
}
