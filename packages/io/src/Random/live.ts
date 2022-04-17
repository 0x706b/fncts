import type { ArrayInt } from "@fncts/base/util/rand";

import { MersenneTwister, MutableRandom } from "@fncts/base/util/rand";

export class LiveRandom implements Random {
  private prng: MutableRandom;
  constructor(seed: number) {
    this.prng = new MutableRandom(new MersenneTwister(seed));
  }

  setSeed(seed: number): UIO<void> {
    return IO.succeed(() => {
      this.prng.setSeed(seed);
    });
  }
  nextDouble  = IO.succeed(() => this.prng.nextDouble());
  nextInt     = IO.succeed(() => this.prng.nextInt());
  nextBoolean = this.nextDouble.flatMap((n) => IO.succeedNow(n > 0.5));
  nextRange(low: number, high: number): UIO<number> {
    return this.nextDouble.flatMap((n) => IO.succeedNow((high - low) * n + low));
  }
  nextIntBetween(low: number, high: number): UIO<number> {
    return IO.succeed(this.prng.nextInt(low, high));
  }
  nextBigIntBetween(low: bigint, high: bigint): UIO<bigint> {
    return IO.succeed(this.prng.nextBigInt(low, high));
  }
  nextArrayIntBetween(low: ArrayInt, high: ArrayInt): UIO<ArrayInt> {
    return IO.succeed(this.prng.nextArrayInt(low, high));
  }
}

/**
 * @tsplus static fncts.io.RandomOps Live
 */
export const live: Random = new LiveRandom((Math.random() * 4294967296) >>> 0);
