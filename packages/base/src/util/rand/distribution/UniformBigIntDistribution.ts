import type Distribution from "@fncts/base/util/rand/distribution/Distribution";
import type { RandomGenerator } from "@fncts/base/util/rand/generator/RandomGenerator";
function uniformBigIntInternal(from: bigint, diff: bigint, rng: RandomGenerator): bigint {
  const MinRng    = BigInt(rng.min());
  const NumValues = BigInt(rng.max() - rng.min() + 1);
  // Number of iterations required to have enough random
  // to build uniform entries in the asked range
  let FinalNumValues = NumValues;
  let NumIterations  = BigInt(1);
  while (FinalNumValues < diff) {
    FinalNumValues *= NumValues;
    ++NumIterations;
  }
  const MaxAcceptedRandom = FinalNumValues - (FinalNumValues % diff);

  while (true) {
    // Aggregate mutiple calls to next() into a single random value
    let value = BigInt(0);
    for (let num = BigInt(0); num !== NumIterations; ++num) {
      const out = rng.next();
      value     = NumValues * value + (BigInt(out) - MinRng);
    }
    if (value < MaxAcceptedRandom) {
      const inDiff = value % diff;
      return inDiff + from;
    }
  }
}
/**
 * Uniformly generate random bigint values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
function uniformBigIntDistribution(from: bigint, to: bigint): Distribution<bigint>;
/**
 * Uniformly generate random bigint values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
function uniformBigIntDistribution(from: bigint, to: bigint, rng: RandomGenerator): bigint;
function uniformBigIntDistribution(from: bigint, to: bigint, rng?: RandomGenerator) {
  const diff = to - from + BigInt(1);
  if (rng != null) {
    return uniformBigIntInternal(from, diff, rng);
  }
  return function (rng: RandomGenerator) {
    return uniformBigIntInternal(from, diff, rng);
  };
}
export { uniformBigIntDistribution };
