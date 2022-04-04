import type { Annotated } from "../Annotations.js";
import type { SpecCase } from "./definition.js";
import type { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";
import type { Spreadable } from "@fncts/base/types.js";

import { identity, tuple } from "@fncts/base/data/function";
import { matchTag, matchTag_ } from "@fncts/base/util/pattern";

import { TestAnnotation } from "../../data/TestAnnotation.js";
import { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import { Annotations } from "../Annotations.js";
import { Spec } from "./definition.js";
import { ExecCase, LabeledCase, MultipleCase, PSpec, ScopedCase, TestCase } from "./definition.js";

/**
 * @tsplus getter fncts.test.control.PSpec annotated
 */
export function annotated<R, E, T>(
  spec: PSpec<R, E, T>,
): PSpec<R & Has<Annotations>, Annotated<E>, Annotated<T>> {
  return spec.transform(
    matchTag(
      {
        Scoped: ({ scoped }) =>
          new ScopedCase(scoped.mapError((e) => tuple(e, TestAnnotationMap.empty))),
        Test: ({ test, annotations }) =>
          new TestCase(Annotations.withAnnotations(test), annotations),
      },
      identity,
    ),
  );
}

/**
 * @tsplus fluent fncts.test.control.PSpec combine
 */
export function combine_<R, E, T, R1, E1, T1>(
  self: PSpec<R, E, T>,
  that: PSpec<R1, E1, T1>,
): PSpec<R & R1, E | E1, T | T1> {
  if (self.caseValue.isMultiple() && that.caseValue.isMultiple()) {
    return MultipleCase(self.caseValue.specs.concat(that.caseValue.specs));
  }
  if (self.caseValue.isMultiple()) {
    return MultipleCase(self.caseValue.specs.append(that));
  }
  if (that.caseValue.isMultiple()) {
    return MultipleCase(that.caseValue.specs.prepend(self));
  }
  return MultipleCase(Conc<PSpec<R & R1, E | E1, T | T1>>(self, that));
}

/**
 * @tsplus fluent fncts.test.control.PSpec contramapEnvironment
 */
export function contramapEnvironment_<R, E, T, R0>(
  self: PSpec<R, E, T>,
  f: (r0: R0) => R,
): PSpec<R0, E, T> {
  return self.transform(
    matchTag(
      {
        Scoped: ({ scoped }) =>
          new ScopedCase(
            scoped.contramapEnvironment((r: R0 & Has<Scope>) => ({
              ...Scope.Tag.of(Scope.Tag.read(r)),
              ...f(r),
            })),
          ),
        Test: ({ test, annotations }) => new TestCase(test.contramapEnvironment(f), annotations),
      },
      identity,
    ),
  );
}

/**
 * @tsplus fluent fncts.test.control.PSpec countTests
 */
export function countTests_<R, E, T>(
  spec: PSpec<R, E, T>,
  f: (t: T) => boolean,
): IO<R & Has<Scope>, E, number> {
  return spec.fold(
    matchTag({
      Exec: ({ spec }) => spec,
      Labeled: ({ spec }) => spec,
      Scoped: ({ scoped }) => scoped.flatten,
      Multiple: ({ specs }) =>
        IO.sequenceIterable(specs).map((specs) => specs.foldLeft(0, (b, a) => b + a)),
      Test: ({ test }) => test.map((t) => (f(t) ? 1 : 0)),
    }),
  );
}

/**
 * @tsplus static fncts.test.control.PSpecOps empty
 */
export const empty: PSpec<unknown, never, never> = multipleCase(Conc.empty());

/**
 * @tsplus fluent fncts.test.control.PSpec exec
 * @tsplus static fncts.test.control.PSpec.ExecCaseOps __call
 */
export function exec<R, E, T>(spec: PSpec<R, E, T>, exec: ExecutionStrategy): PSpec<R, E, T> {
  return new PSpec(new ExecCase(exec, spec));
}

/**
 * @tsplus fluent fncts.test.control.PSpec execute
 */
export function execute<R, E, T>(
  self: PSpec<R, E, T>,
  defExec: ExecutionStrategy,
): IO<R & Has<Scope>, never, PSpec<unknown, E, T>> {
  return IO.environmentWithIO((r: R & Has<Scope>) =>
    self.provideEnvironment(r).foreachExec(IO.failCauseNow, IO.succeedNow, defExec),
  );
}

/**
 * @tsplus fluent fncts.test.control.PSpec filterAnnotations
 */
export function filterAnnotations_<R, E, T, V>(
  spec: PSpec<R, E, T>,
  key: TestAnnotation<V>,
  f: (v: V) => boolean,
): Maybe<PSpec<R, E, T>> {
  return matchTag_(spec.caseValue, {
    Exec: ({ spec, exec }) => spec.filterAnnotations(key, f).map((spec) => ExecCase(spec, exec)),
    Labeled: ({ label, spec }) =>
      spec.filterAnnotations(key, f).map((spec) => LabeledCase(spec, label)),
    Scoped: ({ scoped }) =>
      Just(ScopedCase(scoped.map((spec) => spec.filterAnnotations(key, f).getOrElse(Spec.empty)))),
    Multiple: ({ specs }) => {
      const filtered = specs.filterMap((spec) => spec.filterAnnotations(key, f));
      return filtered.isEmpty ? Nothing() : Just(MultipleCase(filtered));
    },
    Test: ({ test, annotations }) =>
      f(annotations.get(key)) ? Just(TestCase(test, annotations)) : Nothing(),
  });
}

/**
 * @tsplus fluent fncts.test.control.PSpec filterLabels
 */
export function filterLabels_<R, E, T>(
  spec: PSpec<R, E, T>,
  f: (label: string) => boolean,
): Maybe<PSpec<R, E, T>> {
  return matchTag_(spec.caseValue, {
    Exec: ({ spec, exec }) => spec.filterLabels(f).map((spec) => ExecCase(spec, exec)),
    Labeled: ({ label, spec }) =>
      f(label)
        ? Just(LabeledCase(spec, label))
        : spec.filterLabels(f).map((spec) => LabeledCase(spec, label)),
    Scoped: ({ scoped }) =>
      Just(ScopedCase(scoped.map((spec) => spec.filterLabels(f).getOrElse(Spec.empty)))),
    Multiple: ({ specs }) => {
      const filtered = specs.filterMap((spec) => spec.filterLabels(f));
      return filtered.isEmpty ? Nothing() : Just(MultipleCase(filtered));
    },
    Test: () => Nothing(),
  });
}

/**
 * @tsplus fluent fncts.test.control.PSpec filterTags
 */
export function filterTags_<R, E, T>(
  spec: PSpec<R, E, T>,
  f: (tag: string) => boolean,
): Maybe<PSpec<R, E, T>> {
  return spec.filterAnnotations(TestAnnotation.Tagged, (v) => v.exists(f));
}

/**
 * @tsplus fluent fncts.test.control.PSpec fold
 */
export function fold_<R, E, T, Z>(spec: PSpec<R, E, T>, f: (_: SpecCase<R, E, T, Z>) => Z): Z {
  return matchTag_(spec.caseValue, {
    Exec: ({ exec, spec }) => f(new ExecCase(exec, spec.fold(f))),
    Labeled: ({ label, spec }) => f(new LabeledCase(label, spec.fold(f))),
    Scoped: ({ scoped }) => f(new ScopedCase(scoped.map((spec) => spec.fold(f)))),
    Multiple: ({ specs }) => f(new MultipleCase(specs.map((spec) => spec.fold(f)))),
    Test: (t) => f(t),
  });
}

/**
 * @tsplus fluent fncts.test.control.PSpec foldScoped
 */
export function foldScoped_<R, E, T, R1, E1, Z>(
  spec: PSpec<R, E, T>,
  f: (_: SpecCase<R, E, T, Z>) => IO<R1 & Has<Scope>, E1, Z>,
  defExec: ExecutionStrategy,
): IO<R & R1 & Has<Scope>, E1, Z> {
  return matchTag_(spec.caseValue, {
    Exec: ({ exec, spec }) => spec.foldScoped(f, exec).chain((z) => f(new ExecCase(exec, z))),
    Labeled: ({ label, spec }) =>
      spec.foldScoped(f, defExec).chain((z) => f(new LabeledCase(label, z))),
    Scoped: ({ scoped }) =>
      scoped.matchCauseIO(
        (cause) => f(new ScopedCase(IO.haltNow(cause))),
        (spec) => spec.foldScoped(f, defExec).chain((z) => f(new ScopedCase(IO.succeedNow(z)))),
      ),
    Multiple: ({ specs }) =>
      IO.foreachExec(specs, defExec, (spec) => spec.foldScoped(f, defExec).scoped).chain((zs) =>
        f(new MultipleCase(zs)),
      ),
    Test: f,
  });
}

/**
 * @tsplus fluent fncts.test.control.PSpec foreachExec
 */
export function foreachExec_<R, E, T, R1, E1, A, R2, E2, B>(
  spec: PSpec<R, E, T>,
  failure: (c: Cause<E>) => IO<R1, E1, A>,
  success: (t: T) => IO<R2, E2, B>,
  defExec: ExecutionStrategy,
): IO<R & R1 & R2 & Has<Scope>, never, PSpec<R & R1 & R2, E1 | E2, A | B>> {
  return spec.foldScoped(
    matchTag({
      Exec: ({ exec, spec }) => IO.succeedNow(ExecCase(spec, exec)),
      Labeled: ({ label, spec }) => IO.succeedNow(LabeledCase(spec, label)),
      Scoped: ({ scoped }) =>
        scoped.matchCause(
          (cause) => TestCase(failure(cause), TestAnnotationMap.empty),
          (t) => ScopedCase(IO.succeedNow(t)),
        ),
      Multiple: ({ specs }) => IO.succeedNow(MultipleCase(specs)),
      Test: ({ test, annotations }) =>
        test.matchCause(
          (cause) => TestCase(failure(cause), annotations),
          (t) => TestCase(success(t), annotations),
        ),
    }),
    defExec,
  );
}

/**
 * @tsplus fluent fncts.test.control.PSpec labeled
 * @tsplus static fncts.test.control.PSpecOps labeled
 * @tsplus static fncts.test.control.PSpec.LabeledCaseOps __call
 */
export function labeledCase<R, E, T>(spec: PSpec<R, E, T>, label: string): PSpec<R, E, T> {
  return new PSpec(new LabeledCase(label, spec));
}

/**
 * @tsplus fluent fncts.test.control.PSpec scoped
 * @tsplus static fncts.test.control.PSpecOps scoped
 * @tsplus static fncts.test.control.PSpec.ScopedCaseOps __call
 */
export function scoped<R, E, T>(managed: IO<R & Has<Scope>, E, PSpec<R, E, T>>): PSpec<R, E, T> {
  return new PSpec(new ScopedCase(managed));
}

/**
 * @tsplus fluent fncts.test.control.SpecCase mapError
 */
export function mapError<R, E, T, E1>(self: PSpec<R, E, T>, f: (e: E) => E1): PSpec<R, E1, T> {
  return self.transform(
    matchTag(
      {
        Scoped: ({ scoped }) => new ScopedCase(scoped.mapError(f)),
        Test: ({ test, annotations }) => new TestCase(test.mapError(f), annotations),
      },
      identity,
    ),
  );
}

/**
 * @tsplus fluent fncts.test.control.SpecCase map
 */
export function mapSpecCase_<R, E, T, A, B>(
  fa: SpecCase<R, E, T, A>,
  f: (a: A) => B,
): SpecCase<R, E, T, B> {
  return matchTag_(fa, {
    Exec: ({ exec, spec }) => new ExecCase(exec, f(spec)),
    Labeled: ({ label, spec }) => new LabeledCase(label, f(spec)),
    Scoped: ({ scoped }) => new ScopedCase(scoped.map(f)),
    Multiple: ({ specs }) => new MultipleCase(specs.map(f)),
    Test: ({ test, annotations }) => new TestCase(test, annotations),
  });
}

/**
 * @tsplus fluent fncts.test.control.PSpec multiple
 * @tsplus static fncts.test.control.PSpecOps multiple
 * @tsplus static fncts.test.control.PSpec.MultipleCaseOps __call
 */
export function multipleCase<R, E, T>(specs: Conc<PSpec<R, E, T>>): PSpec<R, E, T> {
  return new PSpec(new MultipleCase(specs));
}

/**
 * @tsplus fluent fncts.test.control.PSpec provideEnvironment
 */
export function provideEnvironment_<R, E, T>(self: PSpec<R, E, T>, r: R): PSpec<unknown, E, T> {
  return self.contramapEnvironment(() => r);
}

/**
 * @tsplus fluent fncts.test.control.PSpec provideLayer
 */
export function provideLayer_<RIn, E, ROut extends Spreadable, R, E1, T>(
  self: PSpec<ROut, E1, T>,
  layer: Layer<RIn, E, ROut>,
): PSpec<RIn, E | E1, T> {
  return self.transform(
    matchTag(
      {
        Scoped: ({ scoped }) =>
          new ScopedCase(scoped.provideLayer(Layer.environment<Has<Scope>>().and(layer))),
        Test: ({ test, annotations }) => new TestCase(test.provideLayer(layer), annotations),
      },
      identity,
    ),
  );
}

/**
 * @tsplus fluent fncts.test.control.PSpec test
 * @tsplus static fncts.test.control.PSpecOps test
 * @tsplus static fncts.test.control.PSpec.TestCaseOps __call
 */
export function testCase<R, E, T>(
  test: IO<R, E, T>,
  annotations: TestAnnotationMap,
): PSpec<R, E, T> {
  return new PSpec(new TestCase(test, annotations));
}

/**
 * @tsplus fluent fncts.test.control.PSpec transform
 */
export function transform_<R, E, T, R1, E1, T1>(
  spec: PSpec<R, E, T>,
  f: (_: SpecCase<R, E, T, PSpec<R1, E1, T1>>) => SpecCase<R1, E1, T1, PSpec<R1, E1, T1>>,
): PSpec<R1, E1, T1> {
  return matchTag_(spec.caseValue, {
    Exec: ({ exec, spec }) => new PSpec(f(new ExecCase(exec, spec.transform(f)))),
    Labeled: ({ label, spec }) => new PSpec(f(new LabeledCase(label, spec.transform(f)))),
    Scoped: ({ scoped }) => new PSpec(f(new ScopedCase(scoped.map((spec) => spec.transform(f))))),
    Multiple: ({ specs }) => new PSpec(f(new MultipleCase(specs.map((spec) => spec.transform(f))))),
    Test: (t) => new PSpec(f(t)),
  });
}

/**
 * @tsplus fluent fncts.test.control.PSpec annotate
 */
export function annotate_<R, E, T, V>(
  self: PSpec<R, E, T>,
  key: TestAnnotation<V>,
  value: V,
): PSpec<R, E, T> {
  return self.transform(
    matchTag(
      {
        Test: ({ test, annotations }) => new TestCase(test, annotations.annotate(key, value)),
      },
      identity,
    ),
  );
}
