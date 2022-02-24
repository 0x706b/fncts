import { Equatable, Hashable } from "../../prelude";
import { isObject } from "../../util/predicates";

export const enum MaybeTag {
  Just = "Just",
  Nothing = "Nothing",
}

export const MaybeTypeId = Symbol.for("fncts.data.Maybe");
export type MaybeTypdId = typeof MaybeTypeId;

const _justHash    = Hashable.hashString("fncts.data.Just");
const _nothingHash = Hashable.hashString("fncts.data.Nothing");

/**
 * @tsplus type fncts.Just
 * @tsplus companion fncts.JustOps
 */
export class Just<A> {
  readonly _typeId: MaybeTypdId = MaybeTypeId;
  readonly _tag                 = MaybeTag.Just;
  constructor(readonly value: A) {}
  [Symbol.equatable](that: unknown): boolean {
    return isMaybe(that) && that.isJust() && Equatable.strictEquals(this.value, that.value);
  }
  get [Symbol.hashable]() {
    return Hashable.combineHash(_justHash, Hashable.hash(this.value));
  }
}

/**
 * @tsplus type fncts.Nothing
 * @tsplus companion fncts.NothingOps
 */
export class Nothing {
  readonly _typeId: MaybeTypdId = MaybeTypeId;
  readonly _tag                 = MaybeTag.Nothing;
  [Symbol.equatable](that: unknown): boolean {
    return isMaybe(that) && that.isNothing();
  }
  get [Symbol.hashable]() {
    return _nothingHash;
  }
}

/**
 * @tsplus type fncts.data.Maybe
 */
export type Maybe<A> = Just<A> | Nothing;

/**
 * @tsplus type fncts.data.MaybeOps
 */
export interface MaybeOps {}

export const Maybe: MaybeOps = {};

/**
 * @tsplus unify fncts.data.Maybe
 */
export function unifyMaybe<X extends Maybe<any>>(
  self: X,
): Maybe<[X] extends [Maybe<infer A>] ? A : never> {
  return self;
}

/**
 * @tsplus static fncts.data.MaybeOps isMaybe
 */
export function isMaybe(u: unknown): u is Maybe<unknown> {
  return (
    isObject(u) &&
    (MaybeTypeId in u ||
      ("_tag" in u &&
        typeof u["_tag"] === "string" &&
        (u["_tag"] === "Nothing" || u["_tag"] === "Just")))
  );
}
