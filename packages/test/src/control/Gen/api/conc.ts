import type { Sized } from "../../Sized.js";
import type { EqConstraint, LengthConstraints } from "../constraints.js";

import { Eq, Equatable } from "@fncts/base/typeclass";

import { Gen } from "../definition.js";

/**
 * @tsplus fluent fncts.test.control.Gen conc
 */
export function conc<R, A>(
  self: Gen<R, A>,
  constraints: LengthConstraints = {},
): Gen<R & Has<Random> & Has<Sized>, Conc<A>> {
  const minLength = constraints.minLength ?? 0;
  return constraints.maxLength
    ? Gen.int({ min: minLength, max: constraints.maxLength }).flatMap((n) => self.concN(n))
    : Gen.small((n) => self.concN(n), minLength);
}

/**
 * @tsplus fluent fncts.test.control.Gen concN
 */
export function concN_<R, A>(g: Gen<R, A>, n: number): Gen<R, Conc<A>> {
  return Conc.replicate(n, g).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
    gen.zipWith(a, (as, a) => as.append(a)),
  );
}

/**
 * @tsplus fluent fncts.test.control.Gen uniqueConc
 */
export function uniqueConc_<R, A>(
  self: Gen<R, A>,
  constraints: LengthConstraints & EqConstraint<A> = {},
): Gen<Has<Random> & Has<Sized> & R, Conc<A>> {
  const minLength = constraints.minLength ?? 0;
  const eq        = constraints.eq ?? Eq({ equals_: Equatable.strictEquals });
  return constraints.maxLength
    ? Gen.bounded(minLength, constraints.maxLength, (n) => self.uniqueConcN(eq)(n))
    : Gen.small((n) => self.uniqueConcN(eq)(n), minLength);
}

/**
 * @tsplus getter fncts.test.control.Gen uniqueConcN
 */
export function uniqueConcN_<R, A>(self: Gen<R, A>) {
  return (E: Eq<A>) =>
    (n: number): Gen<R, Conc<A>> =>
      Conc.replicate(n, self).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
        gen.zipWith(a, (as, a) => (as.elem(E)(a) ? as : as.append(a))),
      );
}
