import { isObject } from "../../util/predicates.js";

export const enum MaybeTag {
  Just = "Just",
  Nothing = "Nothing",
}

export const MaybeVariance = Symbol.for("fncts.Maybe.Variance");
export type MaybeVariance = typeof MaybeVariance;

export const MaybeTypeId = Symbol.for("fncts.Maybe");
export type MaybeTypeId = typeof MaybeTypeId;

const IOTypeId = Symbol.for("fncts.io.IO");
type IOTypeId = typeof IOTypeId;

export interface MaybeF extends HKT {
  type: Maybe<this["A"]>;
  variance: {
    A: "+";
  };
}

const _justHash    = Hashable.string("fncts.Just");
const _nothingHash = Hashable.string("fncts.Nothing");

/**
 * @tsplus type fncts.Maybe
 * @tsplus companion fncts.MaybeOps
 */
export abstract class Maybe<A> {
  declare [MaybeVariance]: {
    readonly _A: (_: never) => A;
  };
  readonly [MaybeTypeId]: MaybeTypeId = MaybeTypeId;
  readonly [IOTypeId]: IOTypeId       = IOTypeId;
  readonly trace?: string | undefined = undefined;
}

/**
 * @tsplus type fncts.Just
 * @tsplus companion fncts.JustOps
 */
export class Just<A> extends Maybe<A> {
  readonly _tag = MaybeTag.Just;
  constructor(
    readonly value: A,
    readonly trace?: string,
  ) {
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
  constructor(readonly trace?: string) {
    super();
  }
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
export function unifyMaybe<X extends Maybe<any>>(
  self: X,
): Maybe<[X] extends [{ [MaybeVariance]: { _A: (_: never) => infer A } }] ? A : never> {
  return self;
}

/**
 * @tsplus static fncts.MaybeOps isMaybe
 */
export function isMaybe(u: unknown): u is Maybe<unknown> {
  return isObject(u) && MaybeTypeId in u;
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
