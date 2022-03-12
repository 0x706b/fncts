import type { Has } from "../../prelude.js";
import type { ArrayInt } from "../../util/rand.js";

import { IO } from "../IO.js";
import { Random } from "./definition.js";
import { LiveRandom } from "./live.js";

/**
 * @tsplus static fncts.control.RandomOps live
 */
export const live = new LiveRandom((Math.random() * 4294967296) >>> 0);

/**
 * @tsplus static fncts.control.RandomOps nextDouble
 */
export const nextDouble = IO.serviceWithIO(Random.Tag)((random) => random.nextDouble);

/**
 * @tsplus static fncts.control.RandomOps nextBoolean
 */
export const nextBoolean = IO.serviceWithIO(Random.Tag)((random) => random.nextBoolean);

/**
 * @tsplus static fncts.control.RandomOps nextInt
 */
export const nextInt = IO.serviceWithIO(Random.Tag)((random) => random.nextInt);

/**
 * @tsplus static fncts.control.RandomOps nextRange
 */
export function nextRange(low: number, high: number): IO<Has<Random>, never, number> {
  return IO.serviceWithIO(Random.Tag)((random) => random.nextRange(low, high));
}

/**
 * @tsplus static fncts.control.RandomOps nextIntBetween
 */
export function nextIntBetween(low: number, high: number) {
  return IO.serviceWithIO(Random.Tag)((random) => random.nextIntBetween(low, high));
}

/**
 * @tsplus static fncts.control.RandomOps nextBigIntBetween
 */
export function nextBigIntBetween(low: bigint, high: bigint) {
  return IO.serviceWithIO(Random.Tag)((random) => random.nextBigIntBetween(low, high));
}

/**
 * @tsplus static fncts.control.RandomOps nextArrayIntBetween
 */
export function nextArrayIntBetween(low: ArrayInt, high: ArrayInt) {
  return IO.serviceWithIO(Random.Tag)((random) => random.nextArrayIntBetween(low, high));
}

/**
 * @tsplus static fncts.control.RandomOps setSeed
 */
export function setSeed(seed: number) {
  return IO.serviceWithIO(Random.Tag)((random) => random.setSeed(seed));
}
