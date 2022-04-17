import { FiberRefs } from "@fncts/io/FiberRefs/definition";

/**
 * @tsplus getter fncts.io.FiberRefs fiberRefs
 */
export function fiberRefs(self: FiberRefs): HashSet<FiberRef<unknown>> {
  return self.fiberRefLocals.keySet;
}

/**
 * @tsplus static fncts.io.FiberRefsOps __call
 */
export function make(fiberRefLocals: HashMap<FiberRef<unknown>, Cons<readonly [FiberId.Runtime, unknown]>>): FiberRefs {
  return new FiberRefs(fiberRefLocals);
}

/**
 * @tsplus fluent fncts.io.FiberRefs join
 */
export function join(self: FiberRefs, fiberId: FiberId.Runtime, that: FiberRefs): FiberRefs {
  const parentFiberRefs = self.fiberRefLocals;
  const childFiberRefs  = that.fiberRefLocals;

  const fiberRefLocals = childFiberRefs.foldLeftWithIndex(parentFiberRefs, (ref, parentFiberRefs, childStack) => {
    const parentStack = parentFiberRefs.get(ref).getOrElse(List.empty<readonly [FiberId.Runtime, unknown]>());
    const values      = combine(ref, parentStack, childStack);

    const patches = values.unsafeTail.foldLeft(
      [values.unsafeHead, List.empty<unknown>()] as const,
      ([oldValue, patches], newValue) => [newValue, Cons(ref.diff(oldValue, newValue), patches)] as const,
    )[1].reverse;

    if (patches.isEmpty()) {
      return parentFiberRefs;
    } else {
      const patch    = patches.tail.foldLeft(patches.head, ref.combine);
      const newStack = parentStack.isNonEmpty()
        ? Just(Cons([parentStack.head[0], ref.patch(patch)(parentStack.head[1])], parentStack.tail))
        : Nothing();
      return newStack.match(
        () => parentFiberRefs,
        (newStack) => parentFiberRefs.set(ref, newStack),
      );
    }
  });

  return FiberRefs(fiberRefLocals);
}

/**
 * @tsplus tailRec
 */
function joinLoop<A>(
  parentStack: List<readonly [FiberId.Runtime, A]>,
  childStack: List<readonly [FiberId.Runtime, A]>,
  lastParentValue: A,
  lastChildValue: A,
): List<A> {
  if (parentStack.isNonEmpty() && childStack.isNonEmpty()) {
    const [parentId, parentValue] = parentStack.head;
    const [childId, childValue]   = childStack.head;
    if (parentId == childId) {
      return joinLoop(parentStack.tail, childStack.tail, parentValue, childValue);
    } else if (parentId.id < childId.id) {
      return Cons(
        lastParentValue,
        Cons(
          lastChildValue,
          Cons(
            childValue,
            childStack.map(([_, a]) => a),
          ),
        ),
      );
    } else {
      return Cons(
        lastChildValue,
        Cons(
          childValue,
          childStack.map(([_, a]) => a),
        ),
      );
    }
  } else {
    return Cons(
      lastChildValue,
      childStack.map(([_, a]) => a),
    );
  }
}
function combine<A>(
  fiberRef: FiberRef<A>,
  parentStack: List<readonly [FiberId.Runtime, A]>,
  childStack: Cons<readonly [FiberId.Runtime, A]>,
): List<A> {
  return joinLoop(parentStack.reverse, childStack.reverse, fiberRef.initial, fiberRef.initial);
}
