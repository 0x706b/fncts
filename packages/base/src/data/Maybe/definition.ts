import { isObject } from "../../util/predicates.js";

export const enum MaybeTag {
  Just = "Just",
  Nothing = "Nothing",
}

export const MaybeTypeId = Symbol.for("fncts.Maybe");
export type MaybeTypdId = typeof MaybeTypeId;

const _justHash    = Hashable.string("fncts.Just");
const _nothingHash = Hashable.string("fncts.Nothing");

/**
 * @tsplus type fncts.Just
 * @tsplus companion fncts.JustOps
 */
export class Just<A> {
  readonly _typeId: MaybeTypdId = MaybeTypeId;
  readonly _tag                 = MaybeTag.Just;
  constructor(readonly value: A) {}
  [Symbol.equals](that: unknown): boolean {
    return isMaybe(that) && that.isJust() && Equatable.strictEquals(this.value, that.value);
  }
  get [Symbol.hash]() {
    return Hashable.combine(_justHash, Hashable.unknown(this.value));
  }
}

/**
 * @tsplus type fncts.Nothing
 * @tsplus companion fncts.NothingOps
 */
export class Nothing {
  readonly _typeId: MaybeTypdId = MaybeTypeId;
  readonly _tag                 = MaybeTag.Nothing;
  [Symbol.equals](that: unknown): boolean {
    return isMaybe(that) && that.isNothing();
  }
  get [Symbol.hash]() {
    return _nothingHash;
  }
}

/**
 * @tsplus type fncts.Maybe
 */
export type Maybe<A> = Just<A> | Nothing;

/**
 * @tsplus type fncts.MaybeOps
 */
export interface MaybeOps {}

export const Maybe: MaybeOps = {};

/**
 * @tsplus unify fncts.Maybe
 */
export function unifyMaybe<X extends Maybe<any>>(self: X): Maybe<[X] extends [Maybe<infer A>] ? A : never> {
  return self;
}

/**
 * @tsplus static fncts.MaybeOps isMaybe
 */
export function isMaybe(u: unknown): u is Maybe<unknown> {
  return (
    isObject(u) &&
    (MaybeTypeId in u ||
      ("_tag" in u && typeof u["_tag"] === "string" && (u["_tag"] === "Nothing" || u["_tag"] === "Just")))
  );
}

/**
 * A type predicate determining if a `Maybe` is `Just`
 *
 * @tsplus fluent fncts.Maybe isJust
 */
export function isJust<A>(self: Maybe<A>): self is Just<A> {
  return self._tag === MaybeTag.Just;
}

/**
 * A type predicate determining if a `Maybe` is `Nothing`
 *
 * @tsplus fluent fncts.Maybe isNothing
 */
export function isNothing<A>(self: Maybe<A>): self is Nothing {
  return self._tag === MaybeTag.Nothing;
}
