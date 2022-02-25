import type { Exit } from "../../../data/Exit";
import type { IO } from "../../IO";

export const enum MergeDecisionTag {
  Done = "Done",
  Await = "Await",
}

export const MergeDecisionTypeId = Symbol.for("fncts.control.Channel.MergeDecision");
export type MergeDecisionTypeId = typeof MergeDecisionTypeId;

/**
 * @tsplus type fncts.control.Channel.MergeDecision
 * @tsplus companion fncts.control.Channel.MergeDecisionOps
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
 * @tsplus fluent fncts.control.Channel.MergeDecision concrete
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
 * @tsplus static fncts.control.Channel.MergeDecisionOps Done
 */
export function done<R, E, Z>(io: IO<R, E, Z>): MergeDecision<R, unknown, unknown, E, Z> {
  return new Done(io);
}

/**
 * @tsplus static fncts.control.Channel.MergeDecisionOps Await
 */
export function wait<R, E0, Z0, E, Z>(f: (exit: Exit<E0, Z0>) => IO<R, E, Z>): MergeDecision<R, E0, Z0, E, Z> {
  return new Await(f);
}

/**
 * @tsplus static fncts.control.Channel.MergeDecisionOps AwaitConst
 */
export function awaitConst<R, E, Z>(io: IO<R, E, Z>): MergeDecision<R, unknown, unknown, E, Z> {
  return new Await(() => io);
}
