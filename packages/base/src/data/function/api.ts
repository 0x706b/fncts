/**
 * @tsplus pipeable fncts.Function compose
 */
export function compose<B, C>(g: (b: B) => C) {
  return <A extends ReadonlyArray<any>>(f: (...params: A) => B): ((...params: A) => C) => {
    return (...params) => g(f(...params));
  };
}

/**
 * @tsplus static fncts.FunctionOps constVoid
 */
export function constVoid(): void {
  return undefined;
}

/**
 * @tsplus static fncts.FunctionOps identity
 * @tsplus macro identity
 */
export function identity<A>(a: A): A {
  return a;
}

/**
 * @tsplus static fncts.FunctionOps tuple
 */
export function tuple<A extends ReadonlyArray<unknown>>(...as: A): A {
  return as;
}

/**
 * @tsplus getter fncts.Function tupled
 */
export function tupled<A, B, C>(f: (a: A, b: B) => C): (_: readonly [A, B]) => C {
  return ([a, b]) => f(a, b);
}

/**
 * @tsplus fluent global unsafeCoerce
 * @tsplus static fncts.FunctionOps unsafeCoerce
 * @tsplus macro identity
 */
export function unsafeCoerce<B, A = unknown>(a: A): B {
  return a as unknown as B;
}
