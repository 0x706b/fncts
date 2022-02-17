import type { Byte } from "../../../data/Byte";

import { Array } from "../Array";
import { ByteChunk, Chunk, Conc, Empty, Singleton } from "./definition";

/**
 * @tsplus static fncts.collection.immutable.ConcOps empty
 */
export function empty<B>(): Conc<B> {
  return new Empty();
}

/**
 * @tsplus static fncts.collection.immutable.ConcOps from
 */
export function from<A>(as: Iterable<A>): Conc<A> {
  return new Chunk(Array.from(as));
}

/**
 * @tsplus static fncts.collection.immutable.ConcOps fromBuffer
 */
export function fromBuffer(bytes: Uint8Array): Conc<Byte> {
  return new ByteChunk(bytes);
}

/**
 * @tsplus static fncts.collection.immutable.ConcOps __call
 */
export function make<A>(...as: ReadonlyArray<A>): Conc<A> {
  return new Chunk(as);
}

/**
 * @tsplus static fncts.collection.immutable.ConcOps range
 */
export function range(start: number, end: number): Conc<number> {
  return Conc.fromArray(Array.range(start, end));
}

/**
 * @tsplus static fncts.collection.immutable.ConcOps replicate
 */
export function replicate<A>(n: number, a: A): Conc<A> {
  return Conc.makeBy(n, () => a);
}

/**
 * @tsplus static fncts.collection.immutable.ConcOps single
 */
export function single<A>(a: A): Conc<A> {
  return new Singleton(a);
}
