import { isObject } from "../../util/predicates.js";

export const enum MaybeTag {
  Just = "Just",
  Nothing = "Nothing",
}

export const MaybeTypeId = Symbol.for("fncts.Maybe");
export type MaybeTypdId = typeof MaybeTypeId;

export type MaybeF = Maybe<any>;

const _justHash    = Hashable.string("fncts.Just");
const _nothingHash = Hashable.string("fncts.Nothing");

/**
 * @tsplus type fncts.Maybe
 * @tsplus companion fncts.MaybeOps
 */
export class Maybe<A> {
  readonly _typeId: MaybeTypdId = MaybeTypeId;
  readonly [HKT.F]!: MaybeF;
  readonly [HKT.A]!: () => A;
  readonly [HKT.T]!: Maybe<HKT._A<this>>;
}

/**
 * @tsplus type fncts.Just
 * @tsplus companion fncts.JustOps
 */
export class Just<A> extends Maybe<A> {
  readonly _tag = MaybeTag.Just;
  constructor(readonly value: A) {
    super();
  }
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
export class Nothing extends Maybe<never> {
  readonly _tag = MaybeTag.Nothing;
  [Symbol.equals](that: unknown): boolean {
    return isMaybe(that) && that.isNothing();
  }
  get [Symbol.hash]() {
    return _nothingHash;
  }
}

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
  self.concrete();
  return self._tag === MaybeTag.Just;
}

/**
 * A type predicate determining if a `Maybe` is `Nothing`
 *
 * @tsplus fluent fncts.Maybe isNothing
 */
export function isNothing<A>(self: Maybe<A>): self is Nothing {
  self.concrete();
  return self._tag === MaybeTag.Nothing;
}

/**
 * @tsplus fluent fncts.Maybe concrete
 * @tsplus static fncts.MaybeOps concrete
 * @tsplus macro remove
 */
export function concrete<A>(self: Maybe<A>): asserts self is Just<A> | Nothing {
  //
}
