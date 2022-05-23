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

/**
 * @tsplus derive fncts.Decoder[fncts.These]<_> 10
 */
export function deriveDecoder<A extends These<any, any>>(
  ...[left, right]: [A] extends [These<infer E, infer A>] ? [left: Decoder<E>, right: Decoder<A>] : never
): Decoder<A> {
  const label = `These<${left.label}, ${right.label}>`;
  return Decoder(
    (input) =>
      TheseJson.getDecoder(left, right)
        .decode(input)
        .map((result) =>
          result._tag === "Left"
            ? (These.left(result.left) as A)
            : result._tag === "Right"
            ? (These.right(result.right) as A)
            : (These.both(result.left, result.right) as A),
        ),
    label,
  );
}
