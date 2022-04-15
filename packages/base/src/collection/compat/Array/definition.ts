declare global {
  /**
   * @tsplus type fncts.base.ReadonlyArray
   */
  export interface ReadonlyArray<T> {}

  /**
   * @tsplus type fncts.base.Array
   */
  export interface Array<T> {}

  /**
   * @tsplus type fncts.base.ArrayOps
   */
  export interface ArrayConstructor {}
}

export type ESArray<A> = globalThis.Array<A>;
export type ESReadonlyArray<A> = globalThis.ReadonlyArray<A>;

export const ESArray = Array;
