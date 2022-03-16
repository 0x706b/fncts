import type { AssertionValue } from "./AssertionValue.js";
import type { FreeBooleanAlgebra } from "./FreeBooleanAlgebra.js";
import type { GenFailureDetails } from "./GenFailureDetails.js";
import type { Cons } from "@fncts/base/collection/immutable/List";
import type { Maybe } from "@fncts/base/data/Maybe.js";

export type TestResult = FreeBooleanAlgebra<FailureDetails>;

export class FailureDetails {
  constructor(
    readonly assertion: Cons<AssertionValue<any>>,
    readonly gen: Maybe<GenFailureDetails<any>>,
  ) {}
}
