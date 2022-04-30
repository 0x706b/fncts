declare global {
  /**
   * @tsplus type fncts.Iterable
   */
  export interface Iterable<T> {}

  export const Iterable: IterableOps
}

/**
 * @tsplus type fncts.IterableOps
 */
export interface IterableOps {}

export const Iterable: IterableOps = {};
