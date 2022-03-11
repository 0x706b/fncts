/**
 * @tsplus fluent fncts.data.Function compose
 */
export function compose_<A extends ReadonlyArray<any>, B, C>(
  f: (...params: A) => B,
  g: (b: B) => C,
): (...params: A) => C {
  return (...params) => g(f(...params));
}

/**
 * @tsplus static fncts.data.FunctionOps constVoid
 */
export function constVoid(): void {
  return undefined;
}

/**
 * @tsplus static fncts.data.FunctionOps identity
 * @tsplus macro identity
 */
export function identity<A>(a: A): A {
  return a;
}

/**
 * @tsplus static fncts.data.FunctionOps tuple
 */
export function tuple<A extends ReadonlyArray<unknown>>(...as: A): A {
  return as;
}

/**
 * @tsplus static fncts.data.FunctionOps unsafeCoerce
 * @tsplus macro identity
 */
export function unsafeCoerce<A, B>(a: A): B {
  return a as unknown as B;
}
