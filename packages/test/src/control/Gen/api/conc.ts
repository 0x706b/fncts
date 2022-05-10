import type { Sized } from "../../Sized.js";
import type { EqConstraint, LengthConstraints } from "../constraints.js";

import { Eq, Equatable } from "@fncts/base/typeclass";

import { Gen } from "../definition.js";

/**
 * @tsplus fluent fncts.test.Gen conc
 */
export function conc<R, A>(self: Gen<R, A>, constraints: LengthConstraints = {}): Gen<R & Has<Sized>, Conc<A>> {
  const minLength = constraints.minLength ?? 0;
  return constraints.maxLength
    ? Gen.int({ min: minLength, max: constraints.maxLength }).flatMap((n) => self.concN(n))
    : Gen.small((n) => self.concN(n), minLength);
}

/**
 * @tsplus fluent fncts.test.Gen concN
 */
export function concN_<R, A>(g: Gen<R, A>, n: number): Gen<R, Conc<A>> {
  return Conc.replicate(n, g).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
    gen.zipWith(a, (as, a) => as.append(a)),
  );
}

/**
 * @tsplus fluent fncts.test.Gen uniqueConc
 */
export function uniqueConc_<R, A>(
  self: Gen<R, A>,
  constraints: LengthConstraints & EqConstraint<A> = {},
): Gen<Has<Sized> & R, Conc<A>> {
  const minLength = constraints.minLength ?? 0;
  const eq        = constraints.eq ?? Eq({ equals: Equatable.strictEquals });
  return constraints.maxLength
    ? Gen.bounded(minLength, constraints.maxLength, (n) => self.uniqueConcN(n, eq))
    : Gen.small((n) => self.uniqueConcN(n, eq), minLength);
}

/**
 * @tsplus fluent fncts.test.Gen uniqueConcN
 */
export function uniqueConcN_<R, A>(self: Gen<R, A>, n: number, /** @tsplus auto */ E: Eq<A>): Gen<R, Conc<A>> {
  return Conc.replicate(n, self).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
    gen.zipWith(a, (as, a) => (as.elem(a, E) ? as : as.append(a))),
  );
}
