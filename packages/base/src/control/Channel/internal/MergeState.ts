import type { Either } from "../../../data/Either";
import type { Exit } from "../../../data/Exit";
import type { Fiber } from "../../Fiber";
import type { IO } from "../../IO";

export const enum MergeStateTag {
  BothRunning = "BothRunning",
  LeftDone = "LeftDone",
  RightDone = "RightDone",
}

export class BothRunning<Env, Err, Err1, Err2, Elem, Done, Done1, Done2> {
  readonly _tag = MergeStateTag.BothRunning;
  constructor(readonly left: Fiber<Err, Either<Done, Elem>>, readonly right: Fiber<Err1, Either<Done1, Elem>>) {}
}

export class LeftDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2> {
  readonly _tag = MergeStateTag.LeftDone;
  constructor(readonly f: (_: Exit<Err1, Done1>) => IO<Env, Err2, Done2>) {}
}

export class RightDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2> {
  readonly _tag = MergeStateTag.RightDone;
  constructor(readonly f: (_: Exit<Err, Done>) => IO<Env, Err2, Done2>) {}
}

/**
 * @tsplus type fncts.control.Channel.MergeState
 */
export type MergeState<Env, Err, Err1, Err2, Elem, Done, Done1, Done2> =
  | BothRunning<Env, Err, Err1, Err2, Elem, Done, Done1, Done2>
  | LeftDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2>
  | RightDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2>;

/**
 * @tsplus type fncts.control.Channel.MergeStateOps
 */
export interface MergeStateOps {}

export const MergeState: MergeStateOps = {};

/**
 * @tsplus static fncts.control.Channel.MergeStateOps BothRunning
 */
export function bothRunning<Env, Err, Err1, Err2, Elem, Done, Done1, Done2>(
  left: Fiber<Err, Either<Done, Elem>>,
  right: Fiber<Err1, Either<Done1, Elem>>,
): BothRunning<Env, Err, Err1, Err2, Elem, Done, Done1, Done2> {
  return new BothRunning(left, right);
}

/**
 * @tsplus static fncts.control.Channel.MergeStateOps LeftDone
 */
export function leftDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2>(
  f: (_: Exit<Err1, Done1>) => IO<Env, Err2, Done2>,
): LeftDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2> {
  return new LeftDone(f);
}

/**
 * @tsplus static fncts.control.Channel.MergeStateOps RightDone
 */
export function rightDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2>(
  f: (_: Exit<Err, Done>) => IO<Env, Err2, Done2>,
): RightDone<Env, Err, Err1, Err2, Elem, Done, Done1, Done2> {
  return new RightDone(f);
}
