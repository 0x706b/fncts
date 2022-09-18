/**
 * @tsplus fluent fncts.io.FiberRefs join
 */
export function join(self: FiberRefs, fiberId: FiberId.Runtime, that: FiberRefs): FiberRefs {
  const parentFiberRefs = self.fiberRefLocals;
  const childFiberRefs  = that.fiberRefLocals;

  const fiberRefLocals = childFiberRefs.foldLeftWithIndex(parentFiberRefs, (ref, parentFiberRefs, childStack) => {
    const childValue = childStack.head[1];

    if (childStack.head[0] == fiberId) {
      return parentFiberRefs;
    }

    return parentFiberRefs.get(ref).match(
      () => {
        if (Equatable.strictEquals(childValue, ref.initial)) return parentFiberRefs;
        return parentFiberRefs.set(ref, Cons([fiberId, childValue] as const));
      },
      (parentStack) => {
        const [ancestor, wasModified] = findAncestor(ref, parentStack, childStack);

        if (!wasModified) return parentFiberRefs;

        const patch = ref.diff(ancestor, childValue);

        const oldValue = parentStack.head[1];
        const newValue = ref.join(oldValue, ref.patch(patch)(oldValue));

        if (oldValue === newValue) return parentFiberRefs;

        let newStack: Cons<readonly [FiberId.Runtime, unknown]>;

        if (parentStack.isEmpty()) {
          newStack = Cons([fiberId, newValue] as const);
        } else {
          const [parentFiberId] = parentStack.head;
          if (parentFiberId == fiberId) {
            newStack = Cons([parentFiberId, newValue], parentStack.tail);
          } else {
            newStack = Cons([fiberId, newValue], parentStack);
          }
        }

        return parentFiberRefs.set(ref, newStack);
      },
    );
  });

  return FiberRefs(fiberRefLocals);
}

function compareFiberId(left: FiberId.Runtime, right: FiberId.Runtime): number {
  const compare = Number.Ord.compare(left.startTime, right.startTime);
  return compare === 0 ? Number.Ord.compare(left.id, right.id) : compare;
}

/**
 * @tsplus tailRec
 */
function findAncestor(
  ref: FiberRef<any>,
  parentStack: List<readonly [FiberId.Runtime, any]>,
  childStack: List<readonly [FiberId.Runtime, any]>,
  childModified = false,
): readonly [any, boolean] {
  if (parentStack.isNonEmpty() && childStack.isNonEmpty()) {
    const [parentFiberId]            = parentStack.head;
    const [childFiberId, childValue] = childStack.head;
    const compare                    = compareFiberId(parentFiberId, childFiberId);
    if (compare < 0) {
      return findAncestor(ref, parentStack, childStack.tail, true);
    } else if (compare > 0) {
      return findAncestor(ref, parentStack.tail, childStack, childModified);
    } else {
      return [childValue, childModified];
    }
  }
  return [ref.initial, true];
}
