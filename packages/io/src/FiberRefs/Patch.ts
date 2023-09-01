export const enum FiberRefsPatchTag {
  Empty,
  Add,
  Remove,
  Update,
  AndThen,
}

export const FiberRefsPatchTypeId = Symbol.for("fncts.io.FiberRefs.Patch");
export type FiberRefsPatchTypeId = typeof FiberRefsPatchTypeId;

/**
 * @tsplus type fncts.io.FiberRefs.Patch
 * @tsplus companion fncts.io.FiberRefs.PatchOps
 */
export abstract class FiberRefsPatch {
  readonly [FiberRefsPatchTypeId]: FiberRefsPatchTypeId = FiberRefsPatchTypeId;
}

export class Empty extends FiberRefsPatch {
  readonly _tag = FiberRefsPatchTag.Empty;
}

export class Add<Value> extends FiberRefsPatch {
  readonly _tag = FiberRefsPatchTag.Add;

  constructor(readonly fiberRef: FiberRef<Value>, readonly value: Value) {
    super();
  }
}

export class AndThen extends FiberRefsPatch {
  readonly _tag = FiberRefsPatchTag.AndThen;

  constructor(readonly first: FiberRefsPatch, readonly second: FiberRefsPatch) {
    super();
  }
}

export class Remove<Value> extends FiberRefsPatch {
  readonly _tag = FiberRefsPatchTag.Remove;

  constructor(readonly fiberRef: FiberRef<Value>) {
    super();
  }
}

export class Update<Value, Patch> extends FiberRefsPatch {
  readonly _tag = FiberRefsPatchTag.Update;

  constructor(readonly fiberRef: FiberRef.WithPatch<Value, Patch>, readonly patch: Patch) {
    super();
  }
}

export const empty: FiberRefsPatch = new Empty();

/**
 * @tsplus pipeable fncts.io.FiberRefs.Patch combine
 */
export function combine(second: FiberRefsPatch) {
  return (first: FiberRefsPatch): FiberRefsPatch => {
    return new AndThen(first, second);
  };
}

/**
 * @tsplus static fncts.io.FiberRefs.PatchOps diff
 */
export function diff(oldValue: FiberRefs, newValue: FiberRefs): FiberRefsPatch {
  const [removed, patch] = newValue.unFiberRefs.foldLeftWithIndex(
    [oldValue, empty] as const,
    (fiberRef, [fiberRefs, patch], values) => {
      const newValue = values.head[1];
      return fiberRefs.get(fiberRef).match(
        () => [fiberRefs.delete(fiberRef), patch.combine(new Add(fiberRef, newValue))],
        (oldValue) => {
          if (oldValue === newValue) {
            return [fiberRefs.delete(fiberRef), patch];
          } else {
            return [fiberRefs.delete(fiberRef), patch.combine(new Update(fiberRef, fiberRef.diff(oldValue, newValue)))];
          }
        },
      );
    },
  );

  return removed.unFiberRefs.foldLeftWithIndex(patch, (fiberRef, patch) => patch.combine(new Remove(fiberRef)));
}

/**
 * @tsplus pipeable fncts.io.FiberRefs.Patch __call
 */
export function apply(fiberId: FiberId.Runtime, fiberRefs: FiberRefs) {
  return (self: FiberRefsPatch): FiberRefs => {
    return applyLoop(fiberId, fiberRefs, Cons(self));
  };
}

/**
 * @tsplus tailRec
 */
function applyLoop(fiberId: FiberId.Runtime, fiberRefs: FiberRefs, patches: List<FiberRefsPatch>): FiberRefs {
  if (patches.isEmpty()) {
    return fiberRefs;
  }
  const patch = patches.head;
  const rest  = patches.tail;
  concrete(patch);
  switch (patch._tag) {
    case FiberRefsPatchTag.Add:
      return applyLoop(fiberId, fiberRefs.updateAs(fiberId, patch.fiberRef, patch.value), rest);
    case FiberRefsPatchTag.AndThen:
      return applyLoop(fiberId, fiberRefs, Cons(patch.first, Cons(patch.second, rest)));
    case FiberRefsPatchTag.Empty:
      return applyLoop(fiberId, fiberRefs, rest);
    case FiberRefsPatchTag.Remove:
      return applyLoop(fiberId, fiberRefs.delete(patch.fiberRef), rest);
    case FiberRefsPatchTag.Update:
      return applyLoop(
        fiberId,
        fiberRefs.updateAs(
          fiberId,
          patch.fiberRef,
          patch.fiberRef.patch(patch.patch)(fiberRefs.getOrDefault(patch.fiberRef)),
        ),
        rest,
      );
  }
}

type Concrete = Empty | Add<any> | Remove<any> | Update<any, any> | AndThen;

function concrete(patch: FiberRefsPatch): asserts patch is Concrete {
  //
}
