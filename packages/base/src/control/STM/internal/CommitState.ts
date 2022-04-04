import { TExitTag } from "../../../data/TExit.js";

export interface Done<E, A> {
  readonly _tag: "Done";
  readonly exit: Exit<E, A>;
}

/**
 * @tsplus static fncts.data.CommitStateOps Done
 */
export function Done<E, A>(exit: Exit<E, A>): Done<E, A> {
  return {
    _tag: "Done",
    exit,
  };
}

export interface Interrupted {
  readonly _tag: "Interrupted";
}

/**
 * @tsplus static fncts.data.CommitStateOps Interrupted
 */
export const Interrupted: CommitState<never, never> = {
  _tag: "Interrupted",
};

export interface Running {
  readonly _tag: "Running";
}

/**
 * @tsplus static fncts.data.CommitStateOps Running
 */
export const Running: CommitState<never, never> = {
  _tag: "Running",
};

/**
 * @tsplus type fncts.data.CommitState
 */
export type CommitState<E, A> = Done<E, A> | Interrupted | Running;

/**
 * @tsplus type fncts.data.CommitStateOps
 */
export interface CommitStateOps {}

export const CommitState: CommitStateOps = {};

/**
 * @tsplus getter fncts.data.CommitState isRunning
 */
export function isRunning<E, A>(state: CommitState<E, A>): boolean {
  return state._tag === "Running";
}

/**
 * @tsplus static fncts.data.CommitStateOps done
 */
export function done<E, A>(texit: TExit<E, A>): CommitState<E, A> {
  switch (texit._tag) {
    case TExitTag.Succeed:
      return Done(Exit.succeed(texit.value));
    case TExitTag.Halt:
      return Done(Exit.halt(texit.value));
    case TExitTag.Fail:
      return Done(Exit.fail(texit.value));
    case TExitTag.Interrupt:
      return Done(Exit.interrupt(texit.fiberId));
    case TExitTag.Retry:
      throw new Error("Defect: done being called on TExit.Retry");
  }
}
