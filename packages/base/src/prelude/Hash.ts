export interface Hash<A> {
  readonly hash: (a: A) => number;
}

/**
 * @tsplus type fncts.prelude.Hash
 */
export interface HashOps {}

export const Hash: HashOps = {};

/**
 * @tsplus static fncts.prelude.Hash __call
 */
export function mkHash<A>(F: Hash<A>): Hash<A> {
  return F;
}
