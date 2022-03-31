import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";
import type { FiberRef, PFiberRef } from "../definition.js";

import { matchTag_ } from "../../../util/pattern.js";
import { IO } from "../../IO.js";
import { concrete } from "../definition.js";

/**
 * @tsplus fluent fncts.control.FiberRef locallyScoped
 */
export function locallyScoped_<EA, EB, A, B>(
  fiberRef: PFiberRef<EA, EB, A, B>,
  a: A,
): IO<Has<Scope>, EA, void> {
  concrete(fiberRef);
  return matchTag_(fiberRef, {
    Runtime: (ref: FiberRef.Runtime<A>) =>
      IO.acquireRelease(
        ref.get.chain((old) => ref.set(a).as(old)),
        (a) => ref.set(a),
      ).asUnit,
    Derived: (ref) =>
      ref.use(
        (value, _, setEither) =>
          IO.acquireRelease(
            value.get.chain((old) => setEither(a).match(IO.failNow, (s) => value.set(s).as(old))),
            (s) => value.set(s),
          ).asUnit,
      ),
    DerivedAll: (ref) =>
      ref.use(
        (value, _, setEither) =>
          IO.acquireRelease(
            value.get.chain((old) =>
              setEither(a)(old).match(IO.failNow, (s) => value.set(s).as(old)),
            ),
            (s) => value.set(s),
          ).asUnit,
      ),
  });
}