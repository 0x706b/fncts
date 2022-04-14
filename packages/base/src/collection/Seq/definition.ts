declare global {
  /**
   * @tsplus type fncts.Seq
   */
  export interface Iterable<T> {}
}

export interface ESIterable<A> extends globalThis.Iterable<A> {}

export interface Seq<A> extends ESIterable<A> {}

/**
 * @tsplus type fncts.SeqOps
 */
export interface SeqOps {}

export const Seq: SeqOps = {};
