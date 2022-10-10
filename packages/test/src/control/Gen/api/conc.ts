import type { Sized } from "../../Sized.js";
import type { EqConstraint, LengthConstraints } from "../constraints.js";

import { Eq, Equatable } from "@fncts/base/typeclass";

import { Gen } from "../definition.js";

/**
 * @tsplus pipeable fncts.test.Gen conc
 */
export function conc(constraints: LengthConstraints = {}) {
  return <R, A>(self: Gen<R, A>): Gen<R | Sized, Conc<A>> => {
    const minLength = constraints.minLength ?? 0;
    return constraints.maxLength
      ? Gen.int({ min: minLength, max: constraints.maxLength }).flatMap((n) => self.concN(n))
      : Gen.small((n) => self.concN(n), minLength);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen concN
 */
export function concN(n: number) {
  return <R, A>(g: Gen<R, A>): Gen<R, Conc<A>> => {
    return Conc.replicate(n, g).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
      gen.zipWith(a, (as, a) => as.append(a)),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.Gen uniqueConc
 */
export function uniqueConc<A>(constraints: LengthConstraints & EqConstraint<A> = {}) {
  return <R>(self: Gen<R, A>): Gen<Sized | R, Conc<A>> => {
    const minLength = constraints.minLength ?? 0;
    const eq        = constraints.eq ?? Eq({ equals: Equatable.strictEquals });
    return constraints.maxLength
      ? Gen.bounded(minLength, constraints.maxLength, (n) => self.uniqueConcN(n, eq))
      : Gen.small((n) => self.uniqueConcN(n, eq), minLength);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen uniqueConcN
 */
export function uniqueConcN<A>(n: number, /** @tsplus auto */ E: Eq<A>) {
  return <R>(self: Gen<R, A>): Gen<R, Conc<A>> => {
    return Conc.replicate(n, self).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
      gen.zipWith(a, (as, a) => (as.elem(a, E) ? as : as.append(a))),
    );
  };
}
