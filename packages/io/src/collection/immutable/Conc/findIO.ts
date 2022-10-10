import { concrete } from "@fncts/base/collection/immutable/Conc";

function findIOLoop<R, E, A>(
  iterator: Iterator<ArrayLike<A>>,
  f: (a: A) => IO<R, E, boolean>,
  array: ArrayLike<A>,
  i: number,
  length: number,
  __tsplusTrace?: string,
): IO<R, E, Maybe<A>> {
  if (i < length) {
    const a = array[i]!;
    return f(a).flatMap((b) => (b ? IO.succeedNow(Just(a)) : findIOLoop(iterator, f, array, i + 1, length)));
  }
  let result;
  if (!(result = iterator.next()).done) {
    const arr = result.value;
    const len = arr.length;
    return findIOLoop(iterator, f, arr, 0, len);
  }
  return IO.succeedNow(Nothing());
}

/**
 * @tsplus pipeable fncts.Conc findIO
 */
export function findIO<R, E, A>(f: (a: A) => IO<R, E, boolean>, __tsplusTrace?: string) {
  return (as: Conc<A>): IO<R, E, Maybe<A>> => {
    concrete(as);
    const iterator = as.arrayIterator();
    let result;
    if (!(result = iterator.next()).done) {
      const array  = result.value;
      const length = array.length;
      return findIOLoop(iterator, f, array, 0, length);
    } else {
      return IO.succeedNow(Nothing());
    }
  };
}
