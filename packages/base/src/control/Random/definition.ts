import type { Has } from "../../prelude.js";
import type { ArrayInt } from "../../util/rand.js";
import type { UIO } from "../IO.js";

import { tag } from "../../data/Tag.js";
import { IO } from "../IO.js";

/**
 * @tsplus static fncts.control.RandomOps Tag
 */
export const RandomTag = tag<Random>();

/**
 * @tsplus type fncts.control.Random
 * @tsplus companion fncts.control.RandomOps
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
