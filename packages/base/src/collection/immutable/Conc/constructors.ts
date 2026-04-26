import { ByteChunk, Chunk, Singleton } from "./definition.js";

/**
 * Create a `Conc` from an iterable or array-like value.
 *
 * @tsplus static fncts.ConcOps from
 */
export function from<A>(as: Iterable<A>): Conc<A> {
  if (Array.isArray(as)) return new Chunk(as);
  return new Chunk(Array.from(as));
}

/**
 * Create a `Conc` from a mutable buffer array.
 *
 * @tsplus static fncts.ConcOps fromBuffer
 */
export function fromBuffer(bytes: Uint8Array): Conc<Byte> {
  return new ByteChunk(bytes);
}

/**
 * Create a `Conc` from the provided values.
 *
 * @tsplus static fncts.ConcOps __call
 */
export function make<A>(...as: ReadonlyArray<A>): Conc<A> {
  return new Chunk(as);
}

/**
 * Create a collection of numbers in a range.
 *
 * @tsplus static fncts.ConcOps range
 */
export function range(start: number, end: number): Conc<number> {
  return Conc.fromArray(Array.range(start, end));
}

/**
 * Create a collection containing one element.
 *
 * @tsplus static fncts.ConcOps single
 */
export function single<A>(a: A): Conc<A> {
  return new Singleton(a);
}
