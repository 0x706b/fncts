declare global {
  /** @tsplus type fncts.ReadonlyArray */
  export interface ReadonlyArray<T> {}
  /** @tsplus type fncts.Array */
  export interface Array<T> {}
}

/**
 * @tsplus pipeable fncts.Array groupBy
 * @tsplus pipeable fncts.ReadonlyArray groupBy
 */
export function groupBy<A, K extends PropertyKey>(f: (a: A) => K) {
  return (self: ReadonlyArray<A>): Record<K, ReadonlyArray<A>> => {
    const out = {} as Record<K, Array<A>>;
    for (let i = 0; i < self.length; i++) {
      const a = self[i]!;
      const k = f(a);
      (out[k] ??= []).push(a);
    }
    return out;
  };
}
