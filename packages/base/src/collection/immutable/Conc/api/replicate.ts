/**
 * Create a collection containing `n` copies of a value.
 *
 * @tsplus static fncts.ConcOps replicate
 */
export function replicate<A>(n: number, a: A): Conc<A> {
  return Conc.makeBy(n, () => a);
}
