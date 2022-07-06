export const enum MergeDecisionTag {
  Done = "Done",
  Await = "Await",
}

export const MergeDecisionTypeId = Symbol.for("fncts.io.Channel.MergeDecision");
export type MergeDecisionTypeId = typeof MergeDecisionTypeId;

/**
 * @tsplus type fncts.io.Channel.MergeDecision
 * @tsplus companion fncts.io.Channel.MergeDecisionOps
 */
export abstract class MergeDecision<R, E0, Z0, E, Z> {
  readonly _typeId: MergeDecisionTypeId = MergeDecisionTypeId;
  readonly _R!: (_: R) => void;
  readonly _E0!: (_: E0) => void;
  readonly _Z0!: (_: Z0) => void;
  readonly _E!: () => E;
  readonly _Z!: () => Z;
}

/**
 * @tsplus unify fncts.io.Channel.MergeDecision
 */
export function unifyMergeDecision<X extends MergeDecision<any, any, any, any, any>>(
  _: X,
): MergeDecision<
  [X] extends [MergeDecision<infer R, any, any, any, any>] ? R : never,
  [X] extends [MergeDecision<any, infer E0, any, any, any>] ? E0 : never,
  [X] extends [MergeDecision<any, any, infer Z0, any, any>] ? Z0 : never,
  [X] extends [MergeDecision<any, any, any, infer E, any>] ? E : never,
  [X] extends [MergeDecision<any, any, any, any, infer Z>] ? Z : never
> {
  return _;
}

/**
 * @tsplus fluent fncts.io.Channel.MergeDecision concrete
 * @tsplus macro remove
 */
export function concrete<R, E0, Z0, E, Z>(
  _: MergeDecision<R, E0, Z0, E, Z>,
): asserts _ is Done<R, E, Z> | Await<R, E0, Z0, E, Z> {
  //
}

export class Done<R, E, Z> extends MergeDecision<R, unknown, unknown, E, Z> {
  readonly _tag = MergeDecisionTag.Done;
  constructor(readonly io: IO<R, E, Z>) {
    super();
  }
}

export class Await<R, E0, Z0, E, Z> extends MergeDecision<R, E0, Z0, E, Z> {
  readonly _tag = MergeDecisionTag.Await;
  constructor(readonly f: (_: Exit<E0, Z0>) => IO<R, E, Z>) {
    super();
  }
}

/**
 * @tsplus static fncts.io.Channel.MergeDecisionOps Done
 */
export function done<R, E, Z>(io: IO<R, E, Z>): MergeDecision<R, unknown, unknown, E, Z> {
  return new Done(io);
}

/**
 * @tsplus static fncts.io.Channel.MergeDecisionOps Await
 */
export function wait<R, E0, Z0, E, Z>(f: (exit: Exit<E0, Z0>) => IO<R, E, Z>): MergeDecision<R, E0, Z0, E, Z> {
  return new Await(f);
}

/**
 * @tsplus static fncts.io.Channel.MergeDecisionOps AwaitConst
 */
export function awaitConst<R, E, Z>(io: IO<R, E, Z>): MergeDecision<R, unknown, unknown, E, Z> {
  return new Await(() => io);
}
