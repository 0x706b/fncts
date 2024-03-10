import { isArray } from "@fncts/base/util/predicates";

export const ZippedTypeId = Symbol.for("fncts.Zipped");
export type ZippedTypeId = typeof ZippedTypeId;
export type Zipped<A extends Array<any>> = Readonly<A> & {
  readonly [ZippedTypeId]: ZippedTypeId;
};
export declare namespace Zipped {
  type Make<A, B> = [A] extends [Zipped<infer X>]
    ? [B] extends [Zipped<infer Y>]
      ? Zipped<[...X, ...Y]>
      : Zipped<[...X, B]>
    : [B] extends [Zipped<infer Y>]
      ? Zipped<[A, ...Y]>
      : Zipped<[A, B]>;
}

/**
 * @tsplus type fncts.ZippedOps
 */
export interface ZippedOps {}

export const Zipped: ZippedOps = {};

/**
 * @tsplus static fncts.ZippedOps is
 */
export function isZipped(a: unknown): a is Zipped<Array<unknown>> {
  return isArray(a) && ZippedTypeId in a;
}

/**
 * @tsplus static fncts.ZippedOps __call
 */
export function make<A, B>(a: A, b: B): Zipped.Make<A, B> {
  let zipped: Zipped<any>;
  if (isZipped(a)) {
    if (isZipped(b)) {
      zipped = unsafeCoerce([...a, ...b]);
    } else {
      zipped = unsafeCoerce([...a, b]);
    }
  } else if (isZipped(b)) {
    zipped = unsafeCoerce([a, ...b]);
  } else {
    zipped = unsafeCoerce([a, b]);
  }
  // @ts-expect-error
  zipped[ZippedTypeId] = ZippedTypeId;
  return unsafeCoerce(zipped);
}
