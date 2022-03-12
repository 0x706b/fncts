import type { ArrayInt } from "../../util/rand.js";
import type { UIO } from "../IO.js";
import type { Random } from "./definition.js";

import { MersenneTwister, MutableRandom } from "../../util/rand.js";
import { IO } from "../IO.js";

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
  nextBoolean = this.nextDouble.chain((n) => IO.succeedNow(n > 0.5));
  nextRange(low: number, high: number): UIO<number> {
    return this.nextDouble.chain((n) => IO.succeedNow((high - low) * n + low));
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
