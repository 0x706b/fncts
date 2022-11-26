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
