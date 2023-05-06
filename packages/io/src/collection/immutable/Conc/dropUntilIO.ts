/**
 * @tsplus pipeable fncts.Conc dropUntilIO
 */
export function dropUntilIO<A, R, E>(p: (a: A) => IO<R, E, boolean>, __tsplusTrace?: string) {
  return (self: Conc<A>): IO<R, E, Conc<A>> => {
    return IO.defer(dropUntilIOLoop(self, self[Symbol.iterator](), p, 0));
  };
}

function dropUntilIOLoop<A, R, E>(
  self: Conc<A>,
  iterator: Iterator<A>,
  p: (a: A) => IO<R, E, boolean>,
  index: number,
  __tsplusTrace?: string,
): IO<R, E, Conc<A>> {
  let result: IteratorResult<A>;
  if (!(result = iterator.next()).done) {
    return p(result.value).flatMap((b) =>
      b ? IO.succeed(self.drop(index + 1)) : dropUntilIOLoop(self, iterator, p, index + 1),
    );
  } else {
    return IO.succeed(Conc.empty());
  }
}
