import { MaybeTag } from "@fncts/base/data/Maybe";
import { FiberRefs } from "@fncts/io/FiberRefs/definition";

/**
 * @tsplus getter fncts.io.FiberRefs fiberRefs
 */
export function fiberRefs(self: FiberRefs): HashSet<FiberRef<unknown>> {
  return self.unFiberRefs.keySet;
}

/**
 * @tsplus macro identity
 * @tsplus static fncts.io.FiberRefsOps __call
 */
export function make(fiberRefLocals: HashMap<FiberRef<unknown>, Cons<readonly [FiberId.Runtime, unknown]>>): FiberRefs {
  return FiberRefs.get(fiberRefLocals);
}

/**
 * @tsplus pipeable fncts.io.FiberRefs forkAs
 */
export function forkAs(childId: FiberId.Runtime) {
  return (self: FiberRefs): FiberRefs => {
    const childFiberRefLocals = self.unFiberRefs.mapWithIndex((fiberRef, stack) => {
      const oldValue = stack.head[1];
      const newValue = fiberRef.patch(fiberRef.fork)(oldValue);
      if (oldValue === newValue) {
        return stack;
      } else {
        return Cons([childId, newValue], stack);
      }
    });
    return FiberRefs(childFiberRefLocals);
  };
}

/**
 * @tsplus fluent fncts.io.FiberRefs get
 */
export function get<A>(self: FiberRefs, fiberRef: FiberRef<A>): Maybe<A> {
  return self.unFiberRefs.get(fiberRef).map((_) => _.head[1] as A);
}

/**
 * @tsplus fluent fncts.io.FiberRefs getOrDefault
 */
export function getOrDefault<A>(self: FiberRefs, fiberRef: FiberRef<A>): A {
  const v = self.unFiberRefs.get(fiberRef);
  Maybe.concrete(v);
  if (v._tag === MaybeTag.Just) {
    return v.value.head[1] as A;
  } else {
    return fiberRef.initial;
  }
}

/**
 * @tsplus fluent fncts.io.FiberRefs updateAs
 */
export function updateAs<A>(self: FiberRefs, fiberId: FiberId.Runtime, fiberRef: FiberRef<A>, value: A): FiberRefs {
  const oldStack = self.unFiberRefs.get(fiberRef).getOrElse(List.empty<readonly [FiberId.Runtime, unknown]>());
  let newStack: Cons<readonly [FiberId.Runtime, unknown]>;
  if (oldStack.isEmpty()) {
    newStack = Cons([fiberId, value]);
  } else if (oldStack.head[0] == fiberId) {
    newStack = Cons([fiberId, value], oldStack.tail);
  } else {
    newStack = Cons([fiberId, value], oldStack);
  }
  return FiberRefs(self.unFiberRefs.set(fiberRef, newStack));
}

/**
 * @tsplus fluent fncts.io.FiberRefs delete
 */
export function remove(self: FiberRefs, fiberRef: FiberRef<any>): FiberRefs {
  return FiberRefs(self.unFiberRefs.remove(fiberRef));
}

/**
 * @tsplus getter fncts.io.FiberRefs unFiberRefs
 * @tsplus macro identity
 */
export function unFiberRefs(self: FiberRefs): HashMap<FiberRef<any>, Cons<readonly [FiberId.Runtime, unknown]>> {
  return FiberRefs.reverseGet(self);
}

/**
 * @tsplus pipeable fncts.io.FiberRefs join
 */
export function join(fiberId: FiberId.Runtime, that: FiberRefs) {
  return (self: FiberRefs): FiberRefs => {
    const parentFiberRefs = FiberRefs.reverseGet(self);
    const childFiberRefs  = FiberRefs.reverseGet(that);
    const fiberRefLocals  = childFiberRefs.foldLeftWithIndex(parentFiberRefs, (ref, parentFiberRefs, childStack) => {
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
          const patch    = ref.diff(ancestor, childValue);
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
    return FiberRefs.get(fiberRefLocals);
  };
}

function compareFiberId(left: FiberId.Runtime, right: FiberId.Runtime): number {
  const compare = Number.Ord.compare(right.startTime)(left.startTime);
  return compare === 0 ? Number.Ord.compare(right.id)(left.id) : compare;
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