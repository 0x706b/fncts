import { Fail, Halt, Interrupt, Stackless, Then } from "../definition.js";

/**
 * @tsplus getter fncts.Cause linearize
 */
export function linearize<E>(self: Cause<E>): HashSet<Cause<E>> {
  return self.fold({
    Empty: () => HashSet.makeDefault<Cause<E>>(),
    Fail: (e, trace) => HashSet.makeDefault<Cause<E>>().add(Fail(e, trace)),
    Halt: (t, trace) => HashSet.makeDefault<Cause<E>>().add(Halt(t, trace)),
    Interrupt: (fiberId, trace) => HashSet.makeDefault<Cause<E>>().add(Interrupt(fiberId, trace)),
    Then: (l, r) => l.chain((l) => r.map((r) => Then(l, r))),
    Both: (l, r) => l.union(r),
    Stackless: (cause, stackless) => cause.map((c) => Stackless(c, stackless)),
  });
}
