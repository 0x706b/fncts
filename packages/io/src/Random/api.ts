import type { ArrayInt } from "@fncts/base/util/rand";

/**
 * @tsplus static fncts.io.RandomOps nextDouble
 */
export const nextDouble = IO.randomWith((random) => random.nextDouble);

/**
 * @tsplus static fncts.io.RandomOps nextBoolean
 */
export const nextBoolean = IO.randomWith((random) => random.nextBoolean);

/**
 * @tsplus static fncts.io.RandomOps nextInt
 */
export const nextInt = IO.randomWith((random) => random.nextInt);

/**
 * @tsplus static fncts.io.RandomOps nextRange
 */
export function nextRange(low: number, high: number, __tsplusTrace?: string): IO<never, never, number> {
  return IO.randomWith((random) => random.nextRange(low, high));
}

/**
 * @tsplus static fncts.io.RandomOps nextIntBetween
 */
export function nextIntBetween(low: number, high: number, __tsplusTrace?: string): UIO<number> {
  return IO.randomWith((random) => random.nextIntBetween(low, high));
}

/**
 * @tsplus static fncts.io.RandomOps nextBigIntBetween
 */
export function nextBigIntBetween(low: bigint, high: bigint, __tsplusTrace?: string): UIO<bigint> {
  return IO.randomWith((random) => random.nextBigIntBetween(low, high));
}

/**
 * @tsplus static fncts.io.RandomOps nextArrayIntBetween
 */
export function nextArrayIntBetween(low: ArrayInt, high: ArrayInt, __tsplusTrace?: string): UIO<ArrayInt> {
  return IO.randomWith((random) => random.nextArrayIntBetween(low, high));
}

/**
 * @tsplus static fncts.io.RandomOps setSeed
 */
export function setSeed(seed: number, __tsplusTrace?: string): UIO<void> {
  return IO.randomWith((random) => random.setSeed(seed));
}
