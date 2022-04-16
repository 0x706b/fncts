import type { ArrayInt } from "@fncts/base/util/rand";

/**
 * @tsplus static fncts.io.RandomOps Tag
 */
export const RandomTag = Tag<Random>();

/**
 * @tsplus type fncts.io.Random
 * @tsplus companion fncts.io.RandomOps
 */
export abstract class Random {
  abstract readonly nextDouble: UIO<number>;
  abstract readonly nextBoolean: UIO<boolean>;
  abstract readonly nextInt: UIO<number>;
  abstract nextRange(low: number, high: number): UIO<number>;
  abstract nextIntBetween(low: number, high: number): UIO<number>;
  abstract nextBigIntBetween(low: bigint, high: bigint): UIO<bigint>;
  abstract nextArrayIntBetween(low: ArrayInt, high: ArrayInt): UIO<ArrayInt>;
  abstract setSeed(seed: number): UIO<void>;
}
