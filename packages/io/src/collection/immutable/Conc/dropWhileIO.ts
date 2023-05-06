/**
 * @tsplus pipeable fncts.Conc dropWhileIO
 */
export function dropWhileIO<A, R, E>(p: (a: A) => IO<R, E, boolean>, __tsplusTrace?: string) {
  return (self: Conc<A>): IO<R, E, Conc<A>> => {
    return IO.defer(dropWhileIOLoop(self, self[Symbol.iterator](), p, 0));
  };
}

function dropWhileIOLoop<A, R, E>(
  self: Conc<A>,
  iterator: Iterator<A>,
  p: (a: A) => IO<R, E, boolean>,
  index: number,
  __tsplusTrace?: string,
): IO<R, E, Conc<A>> {
  let result: IteratorResult<A>;
  if (!(result = iterator.next()).done) {
    return p(result.value).flatMap((b) =>
      b ? dropWhileIOLoop(self, iterator, p, index + 1) : IO.succeed(self.drop(index)),
    );
  } else {
    return IO.succeed(Conc.empty());
  }
}
