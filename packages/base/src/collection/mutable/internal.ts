/**
 * Returns the backing table size for a requested capacity, rounded to a power of two and capped at 2^30.
 */
export function tableSizeFor(capacity: number) {
  return Math.min(highestOneBit(Math.max(capacity - 1, 4) * 2), 1 << 30);
}

/**
 * Computes the highest one-bit set in the input value.
 */
export function highestOneBit(i: number) {
  i |= i >> 1;
  i |= i >> 2;
  i |= i >> 4;
  i |= i >> 8;
  i |= i >> 16;
  return i - (i >>> 1);
}

/**
 * Mixes upper bits into lower bits to improve hash distribution.
 */
export function improveHash(originalHash: number): number {
  return originalHash ^ (originalHash >>> 16);
}

/**
 * Allocates a new array of the requested length and copies values from the source array by index.
 */
export function copyOfArray<A>(arr: Array<A>, length: number) {
  const out = new Array<A>(length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = arr[i]!;
  }
  return arr;
}
