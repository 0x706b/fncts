import type { TestAnnotationMap } from "../TestAnnotationMap.js";
import type { TestFailure } from "../TestFailure.js";
import type { TestSuccess } from "../TestSuccess.js";
import type { Conc } from "@fncts/base/collection/immutable/Conc";
import type { Either } from "@fncts/base/data/Either";

export const enum ExecutedSpecCaseTag {
  Test = "Test",
  Labeled = "Labeled",
  Multiple = "Multiple",
}

/**
 * @tsplus type fncts.test.data.ExecutedSpec
 * @tsplus companion fncts.test.data.ExecutedSpecOps
 */
export class ExecutedSpec<E> {
  constructor(readonly caseValue: SpecCase<E, ExecutedSpec<E>>) {}
}

export class TestCase<E> {
  readonly _tag = ExecutedSpecCaseTag.Test;
  constructor(
    readonly test: Either<TestFailure<E>, TestSuccess>,
    readonly annotations: TestAnnotationMap,
  ) {}
}

export class LabeledCase<A> {
  readonly _tag = ExecutedSpecCaseTag.Labeled;
  constructor(readonly label: string, readonly spec: A) {}
}

export class MultipleCase<A> {
  readonly _tag = ExecutedSpecCaseTag.Multiple;
  constructor(readonly specs: Conc<A>) {}
}

/**
 * @tsplus type fncts.test.data.ExecutedSpecCase
 */
export type SpecCase<E, A> = TestCase<E> | LabeledCase<A> | MultipleCase<A>;
