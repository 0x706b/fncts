import { Fail, Halt, Interrupt, Sequential,Stackless } from "../definition.js";

/**
 * @tsplus getter fncts.Cause linearize
 */
export function linearize<E>(self: Cause<E>): HashSet<Cause<E>> {
  return self.fold({
    Empty: () => HashSet.empty<Cause<E>>(),
    Fail: (e, trace) => HashSet.empty<Cause<E>>().add(Fail(e, trace)),
    Halt: (t, trace) => HashSet.empty<Cause<E>>().add(Halt(t, trace)),
    Interrupt: (fiberId, trace) => HashSet.empty<Cause<E>>().add(Interrupt(fiberId, trace)),
    Then: (l, r) => l.flatMap((l) => r.map((r) => Sequential(l, r))),
    Both: (l, r) => l.union(r),
    Stackless: (cause, stackless) => cause.map((c) => Stackless(c, stackless)),
  });
}
