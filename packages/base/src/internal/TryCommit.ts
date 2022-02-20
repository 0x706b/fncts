import type { Exit } from "../data/Exit";
import type { Journal } from "./Journal";

export const TryCommitTypeId = Symbol.for("fncts.data.TryCommit");
export type TryCommitTypeId = typeof TryCommitTypeId;

export type TryCommit<E, A> = Done<E, A> | Suspend;

export const enum TryCommitTag {
  Done = "Done",
  Suspend = "Suspend",
}

export class Done<E, A> {
  readonly _typeId: TryCommitTypeId = TryCommitTypeId;
  readonly _tag                     = TryCommitTag.Done;
  constructor(readonly exit: Exit<E, A>) {}
}

export class Suspend {
  readonly _typeId: TryCommitTypeId = TryCommitTypeId;
  readonly _tag                     = TryCommitTag.Suspend;
  constructor(readonly journal: Journal) {}
}
