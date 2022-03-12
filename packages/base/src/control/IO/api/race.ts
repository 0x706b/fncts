import { Cause } from "../../../data/Cause.js";
import { IO } from "../definition.js";

function maybeDisconnect<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
  return IO.uninterruptibleMask((restore) => restore.force(io));
}

/**
 * Returns an IO that races this effect with the specified effect,
 * returning the first successful `A` from the faster side. If one effect
 * succeeds, the other will be interrupted. If neither succeeds, then the
 * effect will fail with some error.
 *
 * WARNING: The raced effect will safely interrupt the "loser", but will not
 * resume until the loser has been cleanly terminated.
 *
 * @tsplus fluent fncts.control.IO race
 */
export function race_<R, E, A, R1, E1, A1>(
  io: IO<R, E, A>,
  that: IO<R1, E1, A1>,
): IO<R & R1, E | E1, A | A1> {
  return IO.descriptorWith((descriptor) =>
    maybeDisconnect(io).raceWith(
      maybeDisconnect(that),
      (exit, right) =>
        exit.match(
          (cause) => right.join.mapErrorCause((c) => Cause.both(cause, c)),
          (a) => right.interruptAs(descriptor.id).as(a),
        ),
      (exit, left) =>
        exit.match(
          (cause) => left.join.mapErrorCause((c) => Cause.both(cause, c)),
          (a1) => left.interruptAs(descriptor.id).as(a1),
        ),
    ),
  );
}
