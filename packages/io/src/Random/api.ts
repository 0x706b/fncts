import type { ArrayInt } from "@fncts/base/util/rand";

import { LiveRandom } from "./live.js";

/**
 * @tsplus static fncts.control.RandomOps Live
 */
export const live: Random = new LiveRandom((Math.random() * 4294967296) >>> 0);

/**
 * @tsplus static fncts.control.RandomOps nextDouble
 */
export const nextDouble = IO.serviceWithIO((random) => random.nextDouble, Random.Tag);

/**
 * @tsplus static fncts.control.RandomOps nextBoolean
 */
export const nextBoolean = IO.serviceWithIO((random) => random.nextBoolean, Random.Tag);

/**
 * @tsplus static fncts.control.RandomOps nextInt
 */
export const nextInt = IO.serviceWithIO((random) => random.nextInt, Random.Tag);

/**
 * @tsplus static fncts.control.RandomOps nextRange
 */
export function nextRange(low: number, high: number): IO<Has<Random>, never, number> {
  return IO.serviceWithIO((random) => random.nextRange(low, high), Random.Tag);
}

/**
 * @tsplus static fncts.control.RandomOps nextIntBetween
 */
export function nextIntBetween(low: number, high: number) {
  return IO.serviceWithIO((random) => random.nextIntBetween(low, high), Random.Tag);
}

/**
 * @tsplus static fncts.control.RandomOps nextBigIntBetween
 */
export function nextBigIntBetween(low: bigint, high: bigint) {
  return IO.serviceWithIO((random) => random.nextBigIntBetween(low, high), Random.Tag);
}

/**
 * @tsplus static fncts.control.RandomOps nextArrayIntBetween
 */
export function nextArrayIntBetween(low: ArrayInt, high: ArrayInt) {
  return IO.serviceWithIO((random) => random.nextArrayIntBetween(low, high), Random.Tag);
}

/**
 * @tsplus static fncts.control.RandomOps setSeed
 */
export function setSeed(seed: number) {
  return IO.serviceWithIO((random) => random.setSeed(seed), Random.Tag);
}
