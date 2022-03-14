import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import type { Conc } from "@fncts/base/collection/immutable/Conc";
import type { IO } from "@fncts/base/control/IO";
import type { Managed } from "@fncts/base/control/Managed";
import type { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";
import type { _A, _E, _R } from "@fncts/base/types.js";

/**
 * @tsplus type fncts.test.control.PSpec
 * @tsplus companion fncts.test.control.PSpecOps
 */
export class PSpec<R, E, T> {
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => T;

  constructor(readonly caseValue: SpecCase<R, E, T, PSpec<R, E, T>>) {}
}

/**
 * @tsplus type fncts.test.control.PSpecOps
 */
export interface SpecOps {}

export const Spec: SpecOps = {};

export const enum SpecCaseTag {
  Exec = "Exec",
  Labeled = "Labeled",
  Managed = "Managed",
  Multiple = "Multiple",
  Test = "Test",
}

/**
 * @tsplus companion fncts.test.control.PSpec.ExecCaseOps
 */
export class ExecCase<Spec> {
  readonly _tag = SpecCaseTag.Exec;
  constructor(readonly exec: ExecutionStrategy, readonly spec: Spec) {}
}

/**
 * @tsplus companion fncts.test.control.PSpec.LabeledCaseOps
 */
export class LabeledCase<Spec> {
  readonly _tag = SpecCaseTag.Labeled;
  constructor(readonly label: string, readonly spec: Spec) {}
}

/**
 * @tsplus companion fncts.test.control.PSpec.ManagedCaseOps
 */
export class ManagedCase<R, E, Spec> {
  readonly _tag = SpecCaseTag.Managed;
  constructor(readonly managed: Managed<R, E, Spec>) {}
}

/**
 * @tsplus companion fncts.test.control.PSpec.MultipleCaseOps
 */
export class MultipleCase<Spec> {
  readonly _tag = SpecCaseTag.Multiple;
  constructor(readonly specs: Conc<Spec>) {}
}

/**
 * @tsplus companion fncts.test.control.PSpec.TestCaseOps
 */
export class TestCase<R, E, T> {
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => T;
  readonly _tag = SpecCaseTag.Test;
  constructor(readonly test: IO<R, E, T>, readonly annotations: TestAnnotationMap) {}
}

/**
 * @tsplus type fncts.test.control.SpecCase
 */
export type SpecCase<R, E, T, A> =
  | ExecCase<A>
  | LabeledCase<A>
  | ManagedCase<R, E, A>
  | MultipleCase<A>
  | TestCase<R, E, T>;

/**
 * @tsplus fluent fncts.test.control.SpecCase isMultiple
 */
export function isMultiple<R, E, T, A>(self: SpecCase<R, E, T, A>): self is MultipleCase<A> {
  return self._tag === SpecCaseTag.Multiple;
}

/**
 * @tsplus unify fncts.test.control.PSpec
 */
export function unifyPSpec<X extends PSpec<any, any, any>>(_: X): PSpec<_R<X>, _E<X>, _A<X>> {
  return _;
}
