import type { Sized } from "../../Sized.js";
import type { EqConstraint, LengthConstraints } from "../constraints.js";

import { Gen } from "../definition.js";

/**
 * @tsplus fluent fncts.test.Gen array
 */
export function array<R, A>(g: Gen<R, A>, constraints: LengthConstraints = {}): Gen<R & Has<Sized>, ReadonlyArray<A>> {
  const minLength = constraints.minLength || 0;
  return constraints.maxLength
    ? Gen.int({ min: minLength, max: constraints.maxLength }).flatMap((n) => g.arrayN(n))
    : Gen.small((n) => g.arrayN(n), minLength);
}

/**
 * @tsplus fluent fncts.test.Gen arrayN
 */
export function arrayN_<R, A>(self: Gen<R, A>, n: number): Gen<R, ReadonlyArray<A>> {
  return self.concN(n).map((conc) => conc.toArray);
}

/**
 * @tsplus fluent fncts.test.Gen uniqueArray
 */
export function uniqueArray_<R, A>(
  gen: Gen<R, A>,
  constraints: LengthConstraints & EqConstraint<A> = {},
): Gen<Has<Sized> & R, ReadonlyArray<A>> {
  return gen.uniqueConc(constraints).map((conc) => conc.toArray);
}
