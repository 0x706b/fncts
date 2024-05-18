import { tuple } from "@fncts/base/data/function";

import { zipChunks } from "../internal/util.js";

/**
 * @tsplus pipeable fncts.io.Stream zipAllWith
 */
export function zipAllWith<A, R1, E1, B, C, D, F>(
  that: Stream<R1, E1, B>,
  left: (a: A) => C,
  right: (b: B) => D,
  both: (a: A, b: B) => F,
  __tsplusTrace?: string,
) {
  return <R, E>(self: Stream<R, E, A>): Stream<R | R1, E | E1, C | D | F> => {
    return self.combineChunks(that, <State<A, B>>new PullBoth(), (s, l, r) => pull(s, l, r, left, right, both));
  };
}

class DrainLeft {
  readonly _tag = "DrainLeft";
}

class DrainRight {
  readonly _tag = "DrainRight";
}

class PullBoth {
  readonly _tag = "PullBoth";
}

class PullLeft<B> {
  readonly _tag = "PullLeft";
  constructor(readonly rightChunk: Conc<B>) {}
}

class PullRight<A> {
  readonly _tag = "PullRight";
  constructor(readonly leftChunk: Conc<A>) {}
}

type State<A, B> = DrainLeft | DrainRight | PullBoth | PullLeft<B> | PullRight<A>;

function pull<R, E, A, R1, E1, B, C, D, F>(
  state: State<A, B>,
  pullLeft: IO<R, Maybe<E>, Conc<A>>,
  pullRight: IO<R1, Maybe<E1>, Conc<B>>,
  left: (a: A) => C,
  right: (b: B) => D,
  both: (a: A, b: B) => F,
  __tsplusTrace?: string,
): IO<R | R1, never, Exit<Maybe<E | E1>, readonly [Conc<C | D | F>, State<A, B>]>> {
  switch (state._tag) {
    case "DrainLeft":
      return pullLeft.matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        (leftChunk) => IO.succeedNow(Exit.succeed(tuple(leftChunk.map(left), new DrainLeft()))),
      );
    case "DrainRight":
      return pullRight.matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        (rightChunk) => IO.succeedNow(Exit.succeed(tuple(rightChunk.map(right), new DrainRight()))),
      );
    case "PullBoth":
      return pullLeft.unjust.zipConcurrent(pullRight.unjust).matchIO(
        (err) => IO.succeedNow(Exit.fail(Just(err))),
        ([maybeLeftChunk, maybeRightChunk]) =>
          maybeLeftChunk.match(
            () =>
              maybeRightChunk.match(
                () => IO.succeedNow(Exit.fail(Nothing())),
                (rightChunk) => IO.succeedNow(Exit.succeed(tuple(rightChunk.map(right), new DrainRight()))),
              ),
            (leftChunk) =>
              maybeRightChunk.match(
                () => IO.succeedNow(Exit.succeed(tuple(leftChunk.map(left), new DrainLeft()))),
                (rightChunk) => {
                  if (leftChunk.isEmpty && rightChunk.isEmpty) {
                    return pull(new PullBoth(), pullLeft, pullRight, left, right, both);
                  } else if (leftChunk.isEmpty) {
                    return pull(new PullLeft(rightChunk), pullLeft, pullRight, left, right, both);
                  } else if (rightChunk.isEmpty) {
                    return pull(new PullRight(leftChunk), pullLeft, pullRight, left, right, both);
                  } else {
                    return IO.succeedNow(Exit.succeed(zipWithChunks(leftChunk, rightChunk, both)));
                  }
                },
              ),
          ),
      );
    case "PullLeft":
      return pullLeft.matchIO(
        (err) =>
          err.match(
            () => IO.succeedNow(Exit.succeed(tuple(state.rightChunk.map(right), new DrainRight()))),
            (err) => IO.succeedNow(Exit.fail(Just(err))),
          ),
        (leftChunk) => {
          if (leftChunk.isEmpty) {
            return pull(new PullLeft(state.rightChunk), pullLeft, pullRight, left, right, both);
          } else if (state.rightChunk.isEmpty) {
            return pull(new PullRight(leftChunk), pullLeft, pullRight, left, right, both);
          } else {
            return IO.succeedNow(Exit.succeed(zipWithChunks(leftChunk, state.rightChunk, both)));
          }
        },
      );
    case "PullRight":
      return pullRight.matchIO(
        (err) =>
          err.match(
            () => IO.succeedNow(Exit.succeed(tuple(state.leftChunk.map(left), new DrainLeft()))),
            (err) => IO.succeedNow(Exit.fail(Just(err))),
          ),
        (rightChunk) => {
          if (rightChunk.isEmpty) {
            return pull(new PullRight(state.leftChunk), pullLeft, pullRight, left, right, both);
          } else if (state.leftChunk.isEmpty) {
            return pull(new PullLeft(rightChunk), pullLeft, pullRight, left, right, both);
          } else {
            return IO.succeedNow(Exit.succeed(zipWithChunks(state.leftChunk, rightChunk, both)));
          }
        },
      );
  }
}

function zipWithChunks<A, B, C>(
  leftChunk: Conc<A>,
  rightChunk: Conc<B>,
  f: (a: A, b: B) => C,
  __tsplusTrace?: string,
): readonly [Conc<C>, State<A, B>] {
  const [out, r] = zipChunks(leftChunk, rightChunk, f);
  return r.match(
    (leftChunk) => (leftChunk.isEmpty ? [out, new PullBoth()] : [out, new PullRight(leftChunk)]),
    (rightChunk) => (rightChunk.isEmpty ? [out, new PullBoth()] : [out, new PullLeft(rightChunk)]),
  );
}
