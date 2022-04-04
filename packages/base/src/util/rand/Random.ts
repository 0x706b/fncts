import type RandomGenerator from "@fncts/base/util/rand/generator/RandomGenerator";

import { uniformArrayIntDistribution } from "@fncts/base/util/rand/distribution/UniformArrayIntDistribution";
import { uniformBigIntDistribution } from "@fncts/base/util/rand/distribution/UniformBigIntDistribution";
import { uniformIntDistribution } from "@fncts/base/util/rand/distribution/UniformIntDistribution";

/**
 * Wrapper around an instance of a `pure-rand`'s random number generator
 * offering a simpler interface to deal with random with impure patterns
 *
 * @public
 */
export class MutableRandom {
  private static MIN_INT: number     = 0x80000000 | 0;
  private static MAX_INT: number     = 0x7fffffff | 0;
  private static DBL_FACTOR: number  = Math.pow(2, 27);
  private static DBL_DIVISOR: number = Math.pow(2, -53);

  /**
   * Create a mutable random number generator
   * @param internalRng - Immutable random generator from pure-rand library
   */
  constructor(private internalRng: RandomGenerator) {}

  /**
   * Clone the random number generator
   */
  clone(): MutableRandom {
    return new MutableRandom(this.internalRng);
  }

  private uniformIn(rangeMin: number, rangeMax: number): number {
    return uniformIntDistribution(rangeMin, rangeMax, this.internalRng);
  }

  /**
   * Generate an integer having `bits` random bits
   * @param bits - Number of bits to generate
   */
  next(bits: number): number {
    return this.uniformIn(0, (1 << bits) - 1);
  }

  /**
   * Generate a random boolean
   */

  nextBoolean(): boolean {
    return this.uniformIn(0, 1) === 1;
  }

  /**
   * Generate a random integer (32 bits)
   */
  nextInt(): number;

  /**
   * Generate a random integer between min (included) and max (included)
   * @param min - Minimal integer value
   * @param max - Maximal integer value
   */
  nextInt(min: number, max: number): number;
  nextInt(min?: number, max?: number): number {
    return this.uniformIn(
      min == null ? MutableRandom.MIN_INT : min,
      max == null ? MutableRandom.MAX_INT : max,
    );
  }

  /**
   * Generate a random bigint between min (included) and max (included)
   * @param min - Minimal bigint value
   * @param max - Maximal bigint value
   */
  nextBigInt(min: bigint, max: bigint): bigint {
    return uniformBigIntDistribution(min, max, this.internalRng);
  }

  /**
   * Generate a random ArrayInt between min (included) and max (included)
   * @param min - Minimal ArrayInt value
   * @param max - Maximal ArrayInt value
   */
  nextArrayInt(
    min: { sign: 1 | -1; data: number[] },
    max: { sign: 1 | -1; data: number[] },
  ): { sign: 1 | -1; data: number[] } {
    return uniformArrayIntDistribution(min, max, this.internalRng);
  }

  /**
   * Generate a random floating point number between 0.0 (included) and 1.0 (excluded)
   */
  nextDouble(): number {
    const a = this.next(26);
    const b = this.next(27);
    return (a * MutableRandom.DBL_FACTOR + b) * MutableRandom.DBL_DIVISOR;
  }

  setSeed(seed: number): void {
    this.internalRng.setSeed(seed);
  }
}
