export const SupervisorPatchTypeId = Symbol.for("fncts.io.Supervisor.Patch");
export type SupervisorPatchTypeId = typeof SupervisorPatchTypeId;

export const enum SupervisorPatchTag {
  AddSupervisor,
  Combine,
  Empty,
  RemoveSupervisor,
}

/**
 * @tsplus type fncts.io.SupervisorPatch
 * @tsplus companion fncts.io.SupervisorPatchOps
 */
export abstract class SupervisorPatch {
  readonly [SupervisorPatchTypeId]: SupervisorPatchTypeId = SupervisorPatchTypeId;
}

export class AddSupervisor extends SupervisorPatch {
  readonly _tag = SupervisorPatchTag.AddSupervisor;
  constructor(readonly supervisor: Supervisor<any>) {
    super();
  }
}

export class Combine extends SupervisorPatch {
  readonly _tag = SupervisorPatchTag.Combine;
  constructor(
    readonly first: SupervisorPatch,
    readonly second: SupervisorPatch,
  ) {
    super();
  }
}

export class Empty extends SupervisorPatch {
  readonly _tag = SupervisorPatchTag.Empty;
}

export class RemoveSupervisor extends SupervisorPatch {
  readonly _tag = SupervisorPatchTag.RemoveSupervisor;
  constructor(readonly supervisor: Supervisor<any>) {
    super();
  }
}

export type Concrete = AddSupervisor | Combine | Empty | RemoveSupervisor;

/**
 * @tsplus macro remove
 */
export function concrete(_: SupervisorPatch): asserts _ is Concrete {
  //
}

/**
 * @tsplus static fncts.io.SupervisorPatchOps empty
 */
export const empty: SupervisorPatch = new Empty();

/**
 * @tsplus pipeable fncts.io.SupervisorPatch combine
 */
export function combine(second: SupervisorPatch) {
  return (first: SupervisorPatch): SupervisorPatch => {
    return new Combine(first, second);
  };
}

/**
 * @tsplus static fncts.io.SupervisorPatchOps diff
 */
export function diff(oldValue: Supervisor<any>, newValue: Supervisor<any>): SupervisorPatch {
  if (oldValue === newValue) return new Empty();
  else {
    const oldSupervisors = oldValue.toSet;
    const newSupervisors = newValue.toSet;
    const added          = newSupervisors
      .difference(oldSupervisors)
      .foldLeft(SupervisorPatch.empty, (patch, supervisor) => patch.combine(new AddSupervisor(supervisor)));
    const removed = oldSupervisors
      .difference(newSupervisors)
      .foldLeft(SupervisorPatch.empty, (patch, supervisor) => patch.combine(new RemoveSupervisor(supervisor)));
    return added.combine(removed);
  }
}

/** @tsplus tailRec */
function applyLoop(supervisor: Supervisor<any>, patches: List<SupervisorPatch>): Supervisor<any> {
  if (patches.isEmpty()) {
    return supervisor;
  }
  const head = patches.head;
  const tail = patches.tail;
  concrete(head);
  switch (head._tag) {
    case SupervisorPatchTag.AddSupervisor:
      return applyLoop(supervisor.zip(head.supervisor), tail);
    case SupervisorPatchTag.Combine:
      return applyLoop(supervisor, Cons(head.first, Cons(head.second, patches)));
    case SupervisorPatchTag.Empty:
      return applyLoop(supervisor, tail);
    case SupervisorPatchTag.RemoveSupervisor:
      return applyLoop(supervisor.removeSupervisor(head.supervisor), tail);
  }
}

/**
 * @tsplus pipeable fncts.io.SupervisorPatch __call
 */
export function apply(supervisor: Supervisor<any>) {
  return (self: SupervisorPatch): Supervisor<any> => {
    return applyLoop(supervisor, Cons(self));
  };
}
