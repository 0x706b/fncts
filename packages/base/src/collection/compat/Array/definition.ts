declare global {
  /**
   * @tsplus type fncts.ReadonlyArray
   */
  export interface ReadonlyArray<T> {}

  /**
   * @tsplus type fncts.Array
   */
  export interface Array<T> {}

  /**
   * @tsplus type fncts.ArrayOps
   */
  export interface ArrayConstructor {}
}

export type ESArray<A> = globalThis.Array<A>;
export type ESReadonlyArray<A> = globalThis.ReadonlyArray<A>;

export const ESArray = Array;
