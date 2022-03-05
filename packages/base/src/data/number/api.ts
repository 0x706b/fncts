/**
 * @tsplus static fncts.data.numberOps isNumber
 */
export function isNumber(u: unknown): u is number {
  return typeof u === "number";
}
