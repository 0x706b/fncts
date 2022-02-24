import type { Trace } from "../../Trace";

import { Cause } from "../definition";

/**
 * @tsplus fluent fncts.data.Cause mapTrace
 */
export function mapTrace_<E>(self: Cause<E>, f: (trace: Trace) => Trace): Cause<E> {
  return self.fold(
    () => Cause.empty(),
    (e, trace) => Cause.fail(e, f(trace)),
    (u, trace) => Cause.halt(u, f(trace)),
    (id, trace) => Cause.interrupt(id, f(trace)),
    Cause.then,
    Cause.both,
  );
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst mapTrace_
 */
export function mapTrace(f: (trace: Trace) => Trace) {
  return <E>(self: Cause<E>): Cause<E> => mapTrace_(self, f);
}
// codegen:end
