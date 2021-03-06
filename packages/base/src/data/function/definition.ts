declare global {
  /**
   * @tsplus type fncts.Function
   */
  export interface Function {}

  /**
   * @tsplus type fncts.FunctionOps
   */
  export interface FunctionConstructor {}
}

/**
 * @tsplus type fncts.FunctionN
 */
export interface FunctionN<A extends ReadonlyArray<any>, B> {
  (...params: A): B;
}

/**
 * `Lazy` represents a pure computation that may be deferred until it is needed.
 *
 * @note When used as a function parameter, it is treated specially by the compiler.
 * If the compiler detects an argument that does not have the signature `() => A`,
 * it will automatically wrap the argument in a thunk.
 *
 * @tsplus type tsplus/LazyArgument
 */
export interface Lazy<A> {
  (): A;
}
