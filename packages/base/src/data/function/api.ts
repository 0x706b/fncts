/**
 * @tsplus macro identity
 */
export function identity<A>(a: A): A {
  return a;
}

/**
 * @tsplus macro identity
 */
export function unsafeCoerce<A, B>(a: A): B {
  return a as unknown as B;
}

export function tuple<A extends ReadonlyArray<unknown>>(...as: A): A {
  return as;
}
