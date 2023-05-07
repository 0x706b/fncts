import type { Push,Sink } from "../Push.js";

export const SubjectTypeId = Symbol.for("fncts.io.Push.Subject");
export type SubjectTypeId = typeof SubjectTypeId;

/**
 * @tsplus type fncts.io.Push.Subject
 */
export interface Subject<R, E, A> extends Push<R, E, A>, Sink<R, E, A> {
  readonly [SubjectTypeId]: SubjectTypeId;
}

/**
 * @tsplus type fncts.io.Push.SubjectOps
 */
export interface SubjectOps {}

export const Subject: SubjectOps = {};
