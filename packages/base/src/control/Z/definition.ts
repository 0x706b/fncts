import { hasTypeId } from "../../util/predicates.js";

export interface ZF extends HKT {
  type: Z<this["W"], this["S"], this["S"], this["R"], this["E"], this["A"]>;
  variance: {
    W: "+";
    S: "_";
    R: "-";
    E: "+";
    A: "+";
  };
}

export const ZTypeId = Symbol.for("@principia/base/Z");
export type ZTypeId = typeof ZTypeId;

/**
 * `Z<W, S1, S2, R, E, A>` is a purely functional description of a synchronous computation
 * that requires an environment `R` and an initial state `S1` and may either
 * fail with an `E` or succeed with an updated state `S2` and an `A`. Because
 * of its polymorphism `Z` can be used to model a variety of effects
 * including context, state, failure, and logging.
 *
 * @note named `Z` in honor of `ZIO` and because it is, surely, the last synchronous effect type
 * one will ever need
 *
 * @tsplus type fncts.control.Z
 * @tsplus companion fncts.control.ZOps
 */
export abstract class Z<W, S1, S2, R, E, A> {
  readonly _typeId: ZTypeId = ZTypeId;
  readonly _W!: () => W;
  readonly _S1!: (_: S1) => void;
  readonly _S2!: () => S2;
  readonly _R!: () => R;
  readonly _E!: () => E;
  readonly _A!: () => A;
}

/**
 * @tsplus unify fncts.control.Z
 */
export function unifyZ<X extends Z<any, any, any, any, any, any>>(
  _: X,
): Z<
  [X] extends [Z<infer W, any, any, any, any, any>] ? W : never,
  [X] extends [Z<any, infer S1, any, any, any, any>] ? S1 : never,
  [X] extends [Z<any, any, infer S2, any, any, any>] ? S2 : never,
  [X] extends [Z<any, any, any, infer R, any, any>] ? R : never,
  [X] extends [Z<any, any, any, any, infer E, any>] ? E : never,
  [X] extends [Z<any, any, any, any, any, infer A>] ? A : never
> {
  return _;
}

/**
 * @tsplus static fncts.control.ZOps isZ
 */
export function isZ(u: unknown): u is Z<unknown, unknown, unknown, unknown, unknown, unknown> {
  return hasTypeId(u, ZTypeId);
}

export const enum ZTag {
  SucceedNow = "SucceedNow",
  Succeed = "Succeed",
  Defer = "Defer",
  Fail = "Fail",
  Modify = "Modify",
  Chain = "Chain",
  Match = "Match",
  Access = "Access",
  Provide = "Provide",
  Tell = "Tell",
  Listen = "Listen",
  MapLog = "MapLog",
}

export class SucceedNow<A> extends Z<never, unknown, never, never, never, A> {
  readonly _tag = ZTag.SucceedNow;
  constructor(readonly value: A) {
    super();
  }
}

export class Succeed<A> extends Z<never, unknown, never, never, never, A> {
  readonly _tag = ZTag.Succeed;
  constructor(readonly effect: () => A) {
    super();
  }
}

export class Defer<W, S1, S2, R, E, A> extends Z<W, S1, S2, R, E, A> {
  readonly _tag = ZTag.Defer;
  constructor(readonly make: () => Z<W, S1, S2, R, E, A>) {
    super();
  }
}

export class Fail<E> extends Z<never, unknown, never, never, E, never> {
  readonly _tag = ZTag.Fail;
  constructor(readonly cause: Cause<E>) {
    super();
  }
}

export class Modify<S1, S2, A> extends Z<never, S1, S2, never, never, A> {
  readonly _tag = ZTag.Modify;
  constructor(readonly run: (s1: S1) => readonly [A, S2]) {
    super();
  }
}

export class Chain<W, S1, S2, R, E, A, W1, S3, Q, D, B> extends Z<W | W1, S1, S3, Q & R, D | E, B> {
  readonly _tag = ZTag.Chain;
  constructor(readonly ma: Z<W, S1, S2, R, E, A>, readonly f: (a: A) => Z<W1, S2, S3, Q, D, B>) {
    super();
  }
}

export class Match<W, S1, S2, S5, R, E, A, W1, S3, R1, E1, B, W2, S4, R2, E2, C> extends Z<
  W1 | W2,
  S1 & S5,
  S3 | S4,
  R & R1 & R2,
  E1 | E2,
  B | C
> {
  readonly _tag = ZTag.Match;
  constructor(
    readonly z: Z<W, S1, S2, R, E, A>,
    readonly onFailure: (ws: Conc<W>, e: Cause<E>) => Z<W1, S5, S3, R1, E1, B>,
    readonly onSuccess: (ws: Conc<W>, a: A) => Z<W2, S2, S4, R2, E2, C>,
  ) {
    super();
  }
}

export class Access<W, R0, S1, S2, R, E, A> extends Z<W, S1, S2, R0 | R, E, A> {
  readonly _tag = ZTag.Access;
  constructor(readonly asks: (r: Environment<R0>) => Z<W, S1, S2, R, E, A>) {
    super();
  }
}

export class Provide<W, S1, S2, R, E, A> extends Z<W, S1, S2, never, E, A> {
  readonly _tag = ZTag.Provide;
  constructor(readonly ma: Z<W, S1, S2, R, E, A>, readonly env: Environment<R>) {
    super();
  }
}

export class Tell<W> extends Z<W, unknown, never, never, never, void> {
  readonly _tag = ZTag.Tell;
  constructor(readonly log: Conc<W>) {
    super();
  }
}

export class MapLog<W, S1, S2, R, E, A, W1> extends Z<W1, S1, S2, R, E, A> {
  readonly _tag = ZTag.MapLog;
  constructor(readonly ma: Z<W, S1, S2, R, E, A>, readonly modifyLog: (ws: Conc<W>) => Conc<W1>) {
    super();
  }
}

export type Concrete =
  | SucceedNow<any>
  | Fail<any>
  | Modify<any, any, any>
  | Chain<any, any, any, any, any, any, any, any, any, any, any>
  | Match<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
  | Access<any, any, any, any, any, any, any>
  | Provide<any, any, any, any, any, any>
  | Defer<any, any, any, any, any, any>
  | Succeed<any>
  | Tell<any>
  | MapLog<any, any, any, any, any, any, any>;

/**
 * @tsplus static fncts.control.ZOps concrete
 */
export function concrete(_: Z<any, any, any, any, any, any>): asserts _ is Concrete {
  //
}

export const ZErrorTypeId = Symbol.for("@principia/base/Z/ZError");
export type ZErrorTypeId = typeof ZErrorTypeId;

export class ZError<E> {
  readonly _typeId: ZErrorTypeId = ZErrorTypeId;
  constructor(readonly cause: Cause<E>) {}
}

export function isZError(u: unknown): u is ZError<unknown> {
  return hasTypeId(u, ZErrorTypeId);
}
