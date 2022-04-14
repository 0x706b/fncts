import { concrete } from "@fncts/base/collection/immutable/Conc/definition";

function findIOLoop_<R, E, A>(
  iterator: Iterator<ArrayLike<A>>,
  f: (a: A) => IO<R, E, boolean>,
  array: ArrayLike<A>,
  i: number,
  length: number,
): IO<R, E, Maybe<A>> {
  if (i < length) {
    const a = array[i]!;
    return f(a).chain((b) =>
      b ? IO.succeedNow(Just(a)) : findIOLoop_(iterator, f, array, i + 1, length),
    );
  }
  let result;
  if (!(result = iterator.next()).done) {
    const arr = result.value;
    const len = arr.length;
    return findIOLoop_(iterator, f, arr, 0, len);
  }
  return IO.succeedNow(Nothing());
}

/**
 * @tsplus fluent fncts.Conc findIO
 */
export function findIO_<R, E, A>(as: Conc<A>, f: (a: A) => IO<R, E, boolean>): IO<R, E, Maybe<A>> {
  concrete(as);
  const iterator = as.arrayIterator();
  let result;
  if (!(result = iterator.next()).done) {
    const array  = result.value;
    const length = array.length;
    return findIOLoop_(iterator, f, array, 0, length);
  } else {
    return IO.succeedNow(Nothing());
  }
}
