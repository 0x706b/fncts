import { ImmutableArray } from "../ImmutableArray.js";
import { ByteChunk, Chunk, Singleton } from "./definition.js";

/**
 * @tsplus static fncts.ConcOps from
 */
export function from<A>(values: Iterable<A>): Conc<A> {
  if (Array.isArray(values)) return new Chunk(values);
  return new Chunk(Array.from(values));
}

/**
 * @tsplus static fncts.ConcOps fromBuffer
 */
export function fromBuffer(bytes: Uint8Array): Conc<Byte> {
  return new ByteChunk(bytes);
}

/**
 * @tsplus static fncts.ConcOps __call
 */
export function make<A extends ReadonlyArray<any>>(...values: ReadonlyArray<A>): Conc<A[number]> {
  return new Chunk(values);
}

/**
 * @tsplus static fncts.ConcOps range
 */
export function range(start: number, end: number): Conc<number> {
  return Conc.fromArray(ImmutableArray.range(start, end)._array);
}

/**
 * @tsplus static fncts.ConcOps single
 */
export function single<A>(a: A): Conc<A> {
  return new Singleton(a);
}
