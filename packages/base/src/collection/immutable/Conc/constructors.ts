import { ImmutableArray } from "../ImmutableArray.js";
import { ByteChunk, Chunk, Singleton } from "./definition.js";

/**
 * @tsplus static fncts.ConcOps from
 */
export function from<A>(as: Iterable<A>): Conc<A> {
  if (Array.isArray(as)) return new Chunk(as);
  return new Chunk(Array.from(as));
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
export function make<A>(...as: ReadonlyArray<A>): Conc<A> {
  return new Chunk(as);
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
