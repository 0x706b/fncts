import type { Sized } from "../../Sized.js";
import type { EqConstraint, LengthConstraints } from "../constraints.js";

import { Gen } from "../definition.js";

/**
 * @tsplus pipeable fncts.test.Gen array
 */
export function array(constraints: LengthConstraints = {}) {
  return <R, A>(g: Gen<R, A>): Gen<R | Sized, ReadonlyArray<A>> => {
    const minLength = constraints.minLength || 0;
    return constraints.maxLength
      ? Gen.int({ min: minLength, max: constraints.maxLength }).flatMap((n) => g.arrayN(n))
      : Gen.small((n) => g.arrayN(n), minLength);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen arrayN
 */
export function arrayN(n: number) {
  return <R, A>(self: Gen<R, A>): Gen<R, ReadonlyArray<A>> => {
    return self.concN(n).map((conc) => conc.toArray);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen uniqueArray
 */
export function uniqueArray<A>(constraints: LengthConstraints & EqConstraint<A> = {}) {
  return <R>(gen: Gen<R, A>): Gen<Sized | R, ReadonlyArray<A>> => {
    return gen.uniqueConc(constraints).map((conc) => conc.toArray);
  };
}
