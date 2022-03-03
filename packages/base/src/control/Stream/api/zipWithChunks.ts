import type { Conc } from "../../../collection/immutable/Conc";
import type { Either } from "../../../data/Either";
import type { Maybe } from "../../../data/Maybe";
import type { Stream } from "../definition";

import { Exit } from "../../../data/Exit";
import { IO } from "../../IO";
import { zipChunks } from "../internal/util";

class PullBoth {
  readonly _tag = "PullBoth";
}

class PullLeft<A2> {
  readonly _tag = "PullLeft";
  constructor(readonly rightChunk: Conc<A2>) {}
}

class PullRight<A1> {
  readonly _tag = "PullRight";
  constructor(readonly leftChunk: Conc<A1>) {}
}

type State<A1, A2> = PullBoth | PullLeft<A2> | PullRight<A1>;

function pull<R, E, A1, R1, E1, A2, A3>(
  state: State<A1, A2>,
  pullLeft: IO<R, Maybe<E>, Conc<A1>>,
  pullRight: IO<R1, Maybe<E1>, Conc<A2>>,
  f: (as: Conc<A1>, bs: Conc<A2>) => readonly [Conc<A3>, Either<Conc<A1>, Conc<A2>>],
): IO<R & R1, never, Exit<Maybe<E | E1>, readonly [Conc<A3>, State<A1, A2>]>> {
  switch (state._tag) {
    case "PullBoth":
      return pullLeft.zipC(pullRight).matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        ([leftChunk, rightChunk]) => {
          if (leftChunk.isEmpty && rightChunk.isEmpty) {
            return pull(new PullBoth(), pullLeft, pullRight, f);
          } else if (leftChunk.isEmpty) {
            return pull(new PullLeft(rightChunk), pullLeft, pullRight, f);
          } else if (rightChunk.isEmpty) {
            return pull(new PullRight(leftChunk), pullLeft, pullRight, f);
          } else {
            return IO.succeedNow(Exit.succeed(handleSuccess(leftChunk, rightChunk, f)));
          }
        },
      );
    case "PullLeft":
      return pullLeft.matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        (leftChunk) => {
          if (leftChunk.isEmpty) {
            return pull(new PullLeft(state.rightChunk), pullLeft, pullRight, f);
          } else if (state.rightChunk.isEmpty) {
            return pull(new PullRight(leftChunk), pullLeft, pullRight, f);
          } else {
            return IO.succeedNow(Exit.succeed(handleSuccess(leftChunk, state.rightChunk, f)));
          }
        },
      );
    case "PullRight":
      return pullRight.matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        (rightChunk) => {
          if (rightChunk.isEmpty) {
            return pull(new PullRight(state.leftChunk), pullLeft, pullRight, f);
          } else if (state.leftChunk.isEmpty) {
            return pull(new PullLeft(rightChunk), pullLeft, pullRight, f);
          } else {
            return IO.succeedNow(Exit.succeed(handleSuccess(state.leftChunk, rightChunk, f)));
          }
        },
      );
  }
}

function handleSuccess<A1, A2, A3>(
  leftChunk: Conc<A1>,
  rightChunk: Conc<A2>,
  f: (as: Conc<A1>, bs: Conc<A2>) => readonly [Conc<A3>, Either<Conc<A1>, Conc<A2>>],
): readonly [Conc<A3>, State<A1, A2>] {
  const [out, remaining] = f(leftChunk, rightChunk);
  return remaining.match(
    (l) => (leftChunk.isEmpty ? [out, new PullBoth()] : [out, new PullRight(leftChunk)]),
    (r) => (rightChunk.isEmpty ? [out, new PullBoth()] : [out, new PullLeft(rightChunk)]),
  );
}

/**
 * @tsplus fluent fncts.control.Stream zipWithChunks
 */
export function zipWithChunks_<R, E, A, R1, E1, B, C>(
  self: Stream<R, E, A>,
  that: Stream<R1, E1, B>,
  f: (as: Conc<A>, bs: Conc<B>) => readonly [Conc<C>, Either<Conc<A>, Conc<B>>],
): Stream<R & R1, E | E1, C> {
  return self.combineChunks(that, <State<A, B>>new PullBoth(), (s, l, r) => pull(s, l, r, f));
}
