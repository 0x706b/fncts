import type { FiberRef, PFiberRef } from "../definition";

import { matchTag_ } from "../../../util/pattern";
import { IO } from "../../IO";
import { Managed } from "../../Managed";
import { concrete } from "../definition";

/**
 * @tsplus fluent fncts.control.FiberRef locallyManaged
 */
export function locallyManaged_<EA, EB, A, B>(
  fiberRef: PFiberRef<EA, EB, A, B>,
  a: A,
): Managed<unknown, EA, void> {
  concrete(fiberRef);
  return matchTag_(fiberRef, {
    Runtime: (ref: FiberRef.Runtime<A>) =>
      Managed.bracket(
        ref.get.chain((old) => ref.set(a).as(old)),
        (a) => ref.set(a),
      ).asUnit,
    Derived: (ref) =>
      ref.use(
        (value, _, setEither) =>
          Managed.bracket(
            value.get.chain((old) => setEither(a).match(IO.failNow, (s) => value.set(s).as(old))),
            (s) => value.set(s),
          ).asUnit,
      ),
    DerivedAll: (ref) =>
      ref.use(
        (value, _, setEither) =>
          Managed.bracket(
            value.get.chain((old) =>
              setEither(a)(old).match(IO.failNow, (s) => value.set(s).as(old)),
            ),
            (s) => value.set(s),
          ).asUnit,
      ),
  });
}
