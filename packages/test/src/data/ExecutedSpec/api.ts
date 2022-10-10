import type { TestAnnotationMap } from "../TestAnnotationMap.js";
import type { TestFailure } from "../TestFailure.js";
import type { TestSuccess } from "../TestSuccess.js";
import type { SpecCase } from "./definition.js";

import { identity } from "@fncts/base/data/function";
import { matchTag, matchTag_ } from "@fncts/base/util/pattern";

import { ExecutedSpec, TestCase } from "./definition.js";
import { LabeledCase, MultipleCase } from "./definition.js";

/**
 * @tsplus pipeable fncts.test.data.ExecutedSpec fold
 */
export function fold<E, Z>(f: (_: SpecCase<E, Z>) => Z) {
  return (self: ExecutedSpec<E>): Z => {
    return matchTag_(self.caseValue, {
      Labeled: ({ label, spec }) => f(new LabeledCase(label, spec.fold(f))),
      Multiple: ({ specs }) => f(new MultipleCase(specs.map((spec) => spec.fold(f)))),
      Test: f,
    });
  };
}

/**
 * @tsplus static fncts.test.data.ExecutedSpecOps labeled
 */
export function labeled<E>(spec: ExecutedSpec<E>, label: string): ExecutedSpec<E> {
  return new ExecutedSpec(new LabeledCase(label, spec));
}

/**
 * @tsplus pipeable fncts.test.data.ExecutedSpecCase map
 */
export function mapSpecCase<A, B>(f: (a: A) => B) {
  return <E>(self: SpecCase<E, A>): SpecCase<E, B> => {
    return matchTag_(
      self,
      {
        Labeled: ({ label, spec }) => new LabeledCase(label, f(spec)),
        Multiple: ({ specs }) => new MultipleCase(specs.map(f)),
      },
      identity,
    );
  };
}

/**
 * @tsplus static fncts.test.data.ExecutedSpecOps multiple
 */
export function multiple<E>(specs: Conc<ExecutedSpec<E>>): ExecutedSpec<E> {
  return new ExecutedSpec(new MultipleCase(specs));
}

/**
 * @tsplus static fncts.test.data.ExecutedSpecOps test
 */
export function test<E>(test: Either<TestFailure<E>, TestSuccess>, annotations: TestAnnotationMap): ExecutedSpec<E> {
  return new ExecutedSpec(new TestCase(test, annotations));
}

/**
 * @tsplus pipeable fncts.test.data.ExecutedSpec transform
 */
export function transform<E, E1>(f: (_: SpecCase<E, ExecutedSpec<E1>>) => SpecCase<E1, ExecutedSpec<E1>>) {
  return (self: ExecutedSpec<E>): ExecutedSpec<E1> => {
    return matchTag_(self.caseValue, {
      Labeled: ({ label, spec }) => new ExecutedSpec(f(new LabeledCase(label, spec.transform(f)))),
      Multiple: ({ specs }) => new ExecutedSpec(f(new MultipleCase(specs.map((spec) => spec.transform(f))))),
      Test: (t) => new ExecutedSpec(f(t)),
    });
  };
}

/**
 * @tsplus pipeable fncts.test.data.ExecutedSpec exists
 */
export function exists<E>(f: (_: SpecCase<E, boolean>) => boolean) {
  return (self: ExecutedSpec<E>): boolean => {
    return self.fold(
      matchTag({
        Labeled: (c) => c.spec || f(c),
        Multiple: (c) => c.specs.exists(identity) || f(c),
        Test: f,
      }),
    );
  };
}

/**
 * @tsplus getter fncts.test.data.ExecutedSpec size
 */
export function size<E>(self: ExecutedSpec<E>): number {
  return self.fold(
    matchTag({
      Labeled: ({ spec }) => spec,
      Multiple: ({ specs }) => specs.foldLeft(0, (b, a) => b + a),
      Test: () => 1,
    }),
  );
}
