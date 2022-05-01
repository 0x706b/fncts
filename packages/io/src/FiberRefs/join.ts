/**
 * @tsplus fluent fncts.io.FiberRefs join
 */
export function join(self: FiberRefs, fiberId: FiberId.Runtime, that: FiberRefs): FiberRefs {
  const parentFiberRefs = self.fiberRefLocals;
  const childFiberRefs  = that.fiberRefLocals;

  const fiberRefLocals = childFiberRefs.foldLeftWithIndex(parentFiberRefs, (ref, parentFiberRefs, childStack) => {
    const parentStack = parentFiberRefs.get(ref).getOrElse(List.empty<readonly [FiberId.Runtime, unknown]>());

    const ancestor = findAncestor(parentStack, childStack).getOrElse(ref.initial);
    const child    = childStack.head[1];

    const patch = ref.diff(ancestor, child);

    const oldValue = parentStack.head.map((_) => _[1]).getOrElse(ref.initial);
    const newValue = ref.patch(patch)(oldValue);

    if (oldValue === newValue) {
      return parentFiberRefs;
    }

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
  });

  return FiberRefs(fiberRefLocals);
}

function compareFiberId(left: FiberId.Runtime, right: FiberId.Runtime): number {
  const compare = Number.Ord.compare_(left.startTime, right.startTime);
  return compare === 0 ? Number.Ord.compare_(left.id, right.id) : compare;
}

/**
 * @tsplus tailRec
 */
function findAncestor<A>(
  parentStack: List<readonly [FiberId.Runtime, A]>,
  childStack: List<readonly [FiberId.Runtime, A]>,
): Maybe<A> {
  if (parentStack.isNonEmpty() && childStack.isNonEmpty()) {
    const [parentFiberId]            = parentStack.head;
    const [childFiberId, childValue] = childStack.head;
    const compare                    = compareFiberId(parentFiberId, childFiberId);
    if (compare < 0) {
      return findAncestor(parentStack, childStack.tail);
    } else if (compare > 0) {
      return findAncestor(parentStack.tail, childStack);
    } else {
      return Just(childValue);
    }
  }
  return Nothing();
}
