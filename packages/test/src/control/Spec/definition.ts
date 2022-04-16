import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import type { TestFailure } from "../../data/TestFailure.js";
import type { TestSuccess } from "../../data/TestSuccess.js";
import type { _A, _E, _R } from "@fncts/base/types.js";

/**
 * @tsplus type fncts.test.PSpec
 * @tsplus companion fncts.test.PSpecOps
 */
export class PSpec<R, E, T> {
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => T;

  constructor(readonly caseValue: SpecCase<R, E, T, PSpec<R, E, T>>) {}
}

/**
 * @tsplus type fncts.test.PSpecOps
 */
export interface SpecOps {}

export const Spec: SpecOps = {};

/**
 * @tsplus type fncts.test.PSpec
 */
export type Spec<R, E> = PSpec<R, TestFailure<E>, TestSuccess>;

export const enum SpecCaseTag {
  Exec = "Exec",
  Labeled = "Labeled",
  Scoped = "Scoped",
  Multiple = "Multiple",
  Test = "Test",
}

/**
 * @tsplus companion fncts.test.PSpec.ExecCaseOps
 */
export class ExecCase<Spec> {
  readonly _tag = SpecCaseTag.Exec;
  constructor(readonly exec: ExecutionStrategy, readonly spec: Spec) {}
}

/**
 * @tsplus companion fncts.test.PSpec.LabeledCaseOps
 */
export class LabeledCase<Spec> {
  readonly _tag = SpecCaseTag.Labeled;
  constructor(readonly label: string, readonly spec: Spec) {}
}

/**
 * @tsplus companion fncts.test.PSpec.ScopedCaseOps
 */
export class ScopedCase<R, E, Spec> {
  readonly _tag = SpecCaseTag.Scoped;
  constructor(readonly scoped: IO<R & Has<Scope>, E, Spec>) {}
}

/**
 * @tsplus companion fncts.test.PSpec.MultipleCaseOps
 */
export class MultipleCase<Spec> {
  readonly _tag = SpecCaseTag.Multiple;
  constructor(readonly specs: Conc<Spec>) {}
}

/**
 * @tsplus companion fncts.test.PSpec.TestCaseOps
 */
export class TestCase<R, E, T> {
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => T;
  readonly _tag = SpecCaseTag.Test;
  constructor(readonly test: IO<R, E, T>, readonly annotations: TestAnnotationMap) {}
}

/**
 * @tsplus type fncts.test.SpecCase
 */
export type SpecCase<R, E, T, A> =
  | ExecCase<A>
  | LabeledCase<A>
  | ScopedCase<R, E, A>
  | MultipleCase<A>
  | TestCase<R, E, T>;

/**
 * @tsplus fluent fncts.test.SpecCase isMultiple
 */
export function isMultiple<R, E, T, A>(self: SpecCase<R, E, T, A>): self is MultipleCase<A> {
  return self._tag === SpecCaseTag.Multiple;
}

/**
 * @tsplus unify fncts.test.PSpec
 */
export function unifyPSpec<X extends PSpec<any, any, any>>(_: X): PSpec<_R<X>, _E<X>, _A<X>> {
  return _;
}
