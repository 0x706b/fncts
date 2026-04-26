/**
 * Maps each array element with an indexed effectful function, discarding results.
 *
 * @tsplus fluent fncts.ReadonlyArray mapIOWithIndexDiscard
 */
export function foreachArrayWithIndexDiscard<A, R, E>(
  array: ReadonlyArray<A>,
  f: (i: number, a: A) => IO<R, E, unknown>,
): IO<R, E, void> {
  return IO.defer(() => {
    let out: IO<R, E, unknown> = IO.unit;
    for (let i = 0; i < array.length; i++) {
      out = out > f(i, array[i]);
    }
    return out;
  });
}

/**
 * Maps each array element with an effectful function, discarding results.
 *
 * @tsplus fluent fncts.ReadonlyArray mapIODiscard
 */
export function foreachArrayDiscard<A, R, E>(array: ReadonlyArray<A>, f: (a: A) => IO<R, E, unknown>): IO<R, E, void> {
  return array.mapIOWithIndexDiscard((_, a) => f(a));
}

/**
 * Maps each array element with an indexed effectful function, collecting results.
 *
 * @tsplus fluent fncts.ReadonlyArray mapIOWithIndex
 */
export function foreachArrayWithIndex<A, R, E, B>(
  array: ReadonlyArray<A>,
  f: (i: number, a: A) => IO<R, E, B>,
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const acc: Array<B> = Array(array.length);
    return array
      .mapIOWithIndexDiscard((i, a) =>
        f(i, a).flatMap((b) => {
          acc[i] = b;
          return IO.unit;
        }),
      )
      .as(Conc.fromArray(acc));
  });
}

/**
 * Maps each array element with an effectful function, collecting results.
 *
 * @tsplus fluent fncts.ReadonlyArray mapIO
 */
export function foreachArray<A, R, E, B>(array: ReadonlyArray<A>, f: (a: A) => IO<R, E, B>): IO<R, E, Conc<B>> {
  return array.mapIOWithIndex((_, a) => f(a));
}
