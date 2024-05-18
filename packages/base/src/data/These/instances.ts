import { TheseJson } from "@fncts/base/json/TheseJson";

/**
 * @tsplus derive fncts.Guard[fncts.These]<_> 10
 */
export function deriveGuard<A extends These<any, any>>(
  ...[left, right]: [A] extends [These<infer E, infer A>] ? [left: Guard<E>, right: Guard<A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (These.isThese(u)) {
      if (u.isLeft()) {
        return left.is(u.left);
      }
      if (u.isRight()) {
        return right.is(u.right);
      }
      return right.is(u.right) && left.is(u.left);
    }
    return false;
  });
}
