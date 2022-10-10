import type { RandomGenerator } from "@fncts/base/util/rand/generator/RandomGenerator";
/**
 * Generate random value based on a given RandomGenerator.
 * Return the generated value and an offsetted version of the RandomGenerator.
 * @public
 */
type Distribution<T> = (rng: RandomGenerator) => T;
export default Distribution;
export { Distribution };
