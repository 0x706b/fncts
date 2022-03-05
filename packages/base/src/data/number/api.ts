/**
 * @tsplus static fncts.data.NumberOps isNumber
 */
export function isNumber(u: unknown): u is number {
  return typeof u === "number";
}
