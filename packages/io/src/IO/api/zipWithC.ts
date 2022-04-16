/**
 * @tsplus fluent fncts.io.IO zipWithC
 */
export function zipWithC_<R, E, A, R1, E1, B, C>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>,
  f: (a: A, b: B) => C,
): IO<R & R1, E | E1, C> {
  const g = (b: B, a: A) => f(a, b);

  return IO.transplant((graft) =>
    IO.descriptorWith((d) =>
      graft(self).raceWith(
        graft(that),
        (exit, fiber) => coordinateZipWithC<E, E1>()(d.id, f, true, exit, fiber),
        (exit, fiber) => coordinateZipWithC<E, E1>()(d.id, g, false, exit, fiber),
      ),
    ),
  );
}

function coordinateZipWithC<E, E2>() {
  return <B, X, Y>(
    fiberId: FiberId,
    f: (a: X, b: Y) => B,
    leftWinner: boolean,
    winner: Exit<E | E2, X>,
    loser: Fiber<E | E2, Y>,
  ) => {
    return winner.match(
      (cw) =>
        loser.interruptAs(fiberId).flatMap((exit) =>
          exit.match(
            (cl) => (leftWinner ? IO.failCauseNow(Cause.both(cw, cl)) : IO.failCauseNow(Cause.both(cl, cw))),
            () => IO.failCauseNow(cw),
          ),
        ),
      (x) => loser.join.map((y) => f(x, y)),
    );
  };
}
