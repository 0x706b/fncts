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
 * @tsplus fluent fncts.io.FiberRefs get
 */
export function get<A>(self: FiberRefs, fiberRef: FiberRef<A>): Maybe<A> {
  return self.fiberRefLocals.get(fiberRef).map((_) => _.head[1] as A);
}

/**
 * @tsplus fluent fncts.io.FiberRefs getOrDefault
 */
export function getOrDefault<A>(self: FiberRefs, fiberRef: FiberRef<A>): A {
  return self.get(fiberRef).getOrElse(fiberRef.initial);
}

/**
 * @tsplus fluent fncts.io.FiberRefs updatedAs
 */
export function updatedAs<A>(self: FiberRefs, fiberId: FiberId.Runtime, fiberRef: FiberRef<A>, value: A): FiberRefs {
  const oldStack = self.fiberRefLocals.get(fiberRef).getOrElse(List.empty<readonly [FiberId.Runtime, unknown]>());
  let newStack: Cons<readonly [FiberId.Runtime, unknown]>;
  if (oldStack.isEmpty()) {
    newStack = Cons([fiberId, value]);
  } else if (oldStack.head[0] == fiberId) {
    newStack = Cons([fiberId, value], oldStack.tail);
  } else {
    newStack = Cons([fiberId, value], oldStack);
  }
  return FiberRefs(self.fiberRefLocals.set(fiberRef, newStack));
}

/**
 * @tsplus fluent fncts.io.FiberRefs forkAs
 */
export function forkAs(self: FiberRefs, childId: FiberId.Runtime): FiberRefs {
  return FiberRefs(
    self.fiberRefLocals.mapWithIndex((fiberRef, stack) => {
      const oldValue = stack.head[1];
      const newValue = fiberRef.patch(fiberRef.fork)(oldValue);
      if (oldValue === newValue) return stack;
      else return Cons([childId, newValue], stack);
    }),
  );
}

/**
 * @tsplus fluent fncts.io.FiberRefs delete
 */
export function remove(self: FiberRefs, fiberRef: FiberRef<any>): FiberRefs {
  return FiberRefs(self.fiberRefLocals.remove(fiberRef));
}
