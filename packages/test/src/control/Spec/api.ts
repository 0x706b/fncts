import type { Annotated } from "../Annotations.js";
import type { SpecCase } from "./definition.js";
import type { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";
import type { Spreadable } from "@fncts/base/types.js";
import type { TestArgs } from "@fncts/test/data/TestArgs.js";

import { identity, tuple } from "@fncts/base/data/function";
import { matchTag, matchTag_ } from "@fncts/base/util/pattern";
import { TestSuccess } from "@fncts/test/data/TestSuccess";

import { TestAnnotation } from "../../data/TestAnnotation.js";
import { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import { Annotations } from "../Annotations.js";
import { Spec } from "./definition.js";
import { ExecCase, LabeledCase, MultipleCase, PSpec, ScopedCase, TestCase } from "./definition.js";

/**
 * @tsplus getter fncts.test.PSpec annotated
 */
export function annotated<R, E, T>(spec: PSpec<R, E, T>): PSpec<R | Annotations, Annotated<E>, Annotated<T>> {
  return spec.transform(
    matchTag(
      {
        Scoped: ({ scoped }) => new ScopedCase(scoped.mapError((e) => tuple(e, TestAnnotationMap.empty))),
        Test: ({ test, annotations }) => new TestCase(Annotations.withAnnotations(test), annotations),
      },
      identity,
    ),
  );
}

/**
 * @tsplus pipeable fncts.test.PSpec combine
 */
export function combine<R1, E1, T1>(that: PSpec<R1, E1, T1>) {
  return <R, E, T>(self: PSpec<R, E, T>): PSpec<R | R1, E | E1, T | T1> => {
    if (self.caseValue.isMultiple() && that.caseValue.isMultiple()) {
      return MultipleCase<R | R1, E | E1, T | T1>(self.caseValue.specs.concat(that.caseValue.specs));
    }
    if (self.caseValue.isMultiple()) {
      return MultipleCase<R | R1, E | E1, T | T1>(self.caseValue.specs.append(that));
    }
    if (that.caseValue.isMultiple()) {
      return MultipleCase<R | R1, E | E1, T | T1>(that.caseValue.specs.prepend(self));
    }
    return MultipleCase(Conc<PSpec<R | R1, E | E1, T | T1>>(self, that));
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec contramapEnvironment
 */
export function contramapEnvironment<R, R0>(f: (r0: Environment<R0>) => Environment<R>) {
  return <E, T>(self: PSpec<R, E, T>): PSpec<R0, E, T> => {
    return self.transform(
      matchTag(
        {
          Scoped: ({ scoped }) =>
            new ScopedCase(
              scoped.contramapEnvironment((r: Environment<R0 | Scope>) =>
                Environment.empty.add(r.get(Scope.Tag), Scope.Tag).union(f(r as Environment<R0>)),
              ),
            ),
          Test: ({ test, annotations }) => new TestCase(test.contramapEnvironment(f), annotations),
        },
        identity,
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec countTests
 */
export function countTests<T>(f: (t: T) => boolean) {
  return <R, E>(spec: PSpec<R, E, T>): IO<R | Scope, E, number> => {
    return spec.fold(
      matchTag({
        Exec: ({ spec }) => spec,
        Labeled: ({ spec }) => spec,
        Scoped: ({ scoped }) => scoped.flatten,
        Multiple: ({ specs }) => IO.sequenceIterable(specs).map((specs) => specs.foldLeft(0, (b, a) => b + a)),
        Test: ({ test }) => test.map((t) => (f(t) ? 1 : 0)),
      }),
    );
  };
}

/**
 * @tsplus static fncts.test.PSpecOps empty
 */
export const empty: PSpec<never, never, never> = multipleCase(Conc.empty());

/**
 * @tsplus static fncts.test.PSpecOps exec
 * @tsplus static fncts.test.PSpec.ExecCaseOps __call
 */
export function exec<R, E, T>(spec: PSpec<R, E, T>, exec: ExecutionStrategy): PSpec<R, E, T> {
  return new PSpec(new ExecCase(exec, spec));
}

/**
 * @tsplus pipeable fncts.test.PSpec execute
 */
export function execute(defExec: ExecutionStrategy) {
  return <R, E, T>(self: PSpec<R, E, T>): IO<R | Scope, never, PSpec<never, E, T>> => {
    return IO.environmentWithIO((r: Environment<R | Scope>) =>
      self.provideEnvironment(r).foreachExec(IO.failCauseNow, IO.succeedNow, defExec),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec filterAnnotations
 */
export function filterAnnotations<V>(key: TestAnnotation<V>, f: (v: V) => boolean) {
  return <R, E, T>(spec: PSpec<R, E, T>): Maybe<PSpec<R, E, T>> => {
    return matchTag_(spec.caseValue, {
      Exec: ({ spec, exec }) => spec.filterAnnotations(key, f).map((spec) => ExecCase(spec, exec)),
      Labeled: ({ label, spec }) => spec.filterAnnotations(key, f).map((spec) => LabeledCase(spec, label)),
      Scoped: ({ scoped }) =>
        Just(ScopedCase(scoped.map((spec) => spec.filterAnnotations(key, f).getOrElse(Spec.empty)))),
      Multiple: ({ specs }) => {
        const filtered = specs.filterMap((spec) => spec.filterAnnotations(key, f));
        return filtered.isEmpty ? Nothing() : Just(MultipleCase(filtered));
      },
      Test: ({ test, annotations }) => (f(annotations.get(key)) ? Just(TestCase(test, annotations)) : Nothing()),
    });
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec filterLabels
 */
export function filterLabels(f: (label: string) => boolean) {
  return <R, E, T>(spec: PSpec<R, E, T>): Maybe<PSpec<R, E, T>> => {
    return matchTag_(spec.caseValue, {
      Exec: ({ spec, exec }) => spec.filterLabels(f).map((spec) => ExecCase(spec, exec)),
      Labeled: ({ label, spec }) =>
        f(label) ? Just(LabeledCase(spec, label)) : spec.filterLabels(f).map((spec) => LabeledCase(spec, label)),
      Scoped: ({ scoped }) => Just(ScopedCase(scoped.map((spec) => spec.filterLabels(f).getOrElse(Spec.empty)))),
      Multiple: ({ specs }) => {
        const filtered = specs.filterMap((spec) => spec.filterLabels(f));
        return filtered.isEmpty ? Nothing() : Just(MultipleCase(filtered));
      },
      Test: () => Nothing(),
    });
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec filterTags
 */
export function filterTags(f: (tag: string) => boolean) {
  return <R, E, T>(spec: PSpec<R, E, T>): Maybe<PSpec<R, E, T>> => {
    return spec.filterAnnotations(TestAnnotation.Tagged, (v) => v.exists(f));
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec filterByArgs
 */
export function filterByArgs(args: TestArgs) {
  return <R, E>(spec: Spec<R, E>): Spec<R, E> => {
    return spec
      .filterTags(args.tagSearchTerms.elem(String.Eq))
      .flatMap((spec) =>
        spec.filterLabels((label) => args.testSearchTerms.findIndex((term) => term.includes(label)) === -1),
      )
      .getOrElse(() => spec);
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec fold
 */
export function fold<R, E, T, Z>(f: (_: SpecCase<R, E, T, Z>) => Z) {
  return (spec: PSpec<R, E, T>): Z => {
    return matchTag_(spec.caseValue, {
      Exec: ({ exec, spec }) => f(new ExecCase(exec, spec.fold(f))),
      Labeled: ({ label, spec }) => f(new LabeledCase(label, spec.fold(f))),
      Scoped: ({ scoped }) => f(new ScopedCase(scoped.map((spec) => spec.fold(f)))),
      Multiple: ({ specs }) => f(new MultipleCase(specs.map((spec) => spec.fold(f)))),
      Test: (t) => f(t),
    });
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec foldScoped
 */
export function foldScoped<R, E, T, R1, E1, Z>(
  f: (_: SpecCase<R, E, T, Z>) => IO<R1 | Scope, E1, Z>,
  defExec: ExecutionStrategy,
) {
  return (spec: PSpec<R, E, T>): IO<R | R1 | Scope, E1, Z> => {
    return matchTag_(spec.caseValue, {
      Exec: ({ exec, spec }) => spec.foldScoped(f, exec).flatMap((z) => f(new ExecCase(exec, z))),
      Labeled: ({ label, spec }) => spec.foldScoped(f, defExec).flatMap((z) => f(new LabeledCase(label, z))),
      Scoped: ({ scoped }) =>
        scoped.matchCauseIO(
          (cause) => f(new ScopedCase(IO.haltNow(cause))),
          (spec) => spec.foldScoped(f, defExec).flatMap((z) => f(new ScopedCase(IO.succeedNow(z)))),
        ),
      Multiple: ({ specs }) =>
        IO.foreachExec(specs, defExec, (spec) => spec.foldScoped(f, defExec).scoped).flatMap((zs) =>
          f(new MultipleCase(zs)),
        ),
      Test: f,
    });
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec foreachExec
 */
export function foreachExec<E, T, R1, E1, A, R2, E2, B>(
  failure: (c: Cause<E>) => IO<R1, E1, A>,
  success: (t: T) => IO<R2, E2, B>,
  defExec: ExecutionStrategy,
) {
  return <R>(spec: PSpec<R, E, T>): IO<R | R1 | R2 | Scope, never, PSpec<R | R1 | R2, E1 | E2, A | B>> => {
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
  };
}

/**
 * @tsplus fluent fncts.test.PSpec labeled
 * @tsplus static fncts.test.PSpecOps labeled
 * @tsplus static fncts.test.PSpec.LabeledCaseOps __call
 */
export function labeledCase<R, E, T>(spec: PSpec<R, E, T>, label: string): PSpec<R, E, T> {
  return new PSpec(new LabeledCase(label, spec));
}

/**
 * @tsplus static fncts.test.PSpecOps scoped
 * @tsplus static fncts.test.PSpec.ScopedCaseOps __call
 */
export function scoped<R, E, T>(managed: IO<R | Scope, E, PSpec<R, E, T>>): PSpec<R, E, T> {
  return new PSpec(new ScopedCase(managed));
}

/**
 * @tsplus pipeable fncts.test.SpecCase mapError
 */
export function mapError<E, E1>(f: (e: E) => E1) {
  return <R, T>(self: PSpec<R, E, T>): PSpec<R, E1, T> => {
    return self.transform(
      matchTag(
        {
          Scoped: ({ scoped }) => new ScopedCase(scoped.mapError(f)),
          Test: ({ test, annotations }) => new TestCase(test.mapError(f), annotations),
        },
        identity,
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.SpecCase map
 */
export function mapSpecCase<A, B>(f: (a: A) => B) {
  return <R, E, T>(fa: SpecCase<R, E, T, A>): SpecCase<R, E, T, B> => {
    return matchTag_(fa, {
      Exec: ({ exec, spec }) => new ExecCase(exec, f(spec)),
      Labeled: ({ label, spec }) => new LabeledCase(label, f(spec)),
      Scoped: ({ scoped }) => new ScopedCase(scoped.map(f)),
      Multiple: ({ specs }) => new MultipleCase(specs.map(f)),
      Test: ({ test, annotations }) => new TestCase(test, annotations),
    });
  };
}

/**
 * @tsplus static fncts.test.PSpecOps multiple
 * @tsplus static fncts.test.PSpec.MultipleCaseOps __call
 */
export function multipleCase<R, E, T>(specs: Conc<PSpec<R, E, T>>): PSpec<R, E, T> {
  return new PSpec(new MultipleCase(specs));
}

/**
 * @tsplus pipeable fncts.test.PSpec provideEnvironment
 */
export function provideEnvironment<R>(r: Environment<R>) {
  return <E, T>(self: PSpec<R, E, T>): PSpec<never, E, T> => {
    return self.contramapEnvironment(() => r);
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec provideLayer
 */
export function provideLayer<RIn, E, ROut>(layer: Layer<RIn, E, ROut>) {
  return <E1, T>(self: PSpec<ROut, E1, T>): PSpec<RIn, E | E1, T> => {
    return self.transform(
      matchTag(
        {
          Scoped: ({ scoped }) => new ScopedCase(scoped.provideLayer(Layer.environment<Scope>().and(layer))),
          Test: ({ test, annotations }) => new TestCase(test.provideLayer(layer), annotations),
        },
        identity,
      ),
    );
  };
}

/**
 * @tsplus static fncts.test.PSpecOps test
 * @tsplus static fncts.test.PSpec.TestCaseOps __call
 */
export function testCase<R, E, T>(test: IO<R, E, T>, annotations: TestAnnotationMap): PSpec<R, E, T> {
  return new PSpec(new TestCase(test, annotations));
}

/**
 * @tsplus pipeable fncts.test.PSpec transform
 */
export function transform<R, E, T, R1, E1, T1>(
  f: (_: SpecCase<R, E, T, PSpec<R1, E1, T1>>) => SpecCase<R1, E1, T1, PSpec<R1, E1, T1>>,
) {
  return (spec: PSpec<R, E, T>): PSpec<R1, E1, T1> => {
    return matchTag_(spec.caseValue, {
      Exec: ({ exec, spec }) => new PSpec(f(new ExecCase(exec, spec.transform(f)))),
      Labeled: ({ label, spec }) => new PSpec(f(new LabeledCase(label, spec.transform(f)))),
      Scoped: ({ scoped }) => new PSpec(f(new ScopedCase(scoped.map((spec) => spec.transform(f))))),
      Multiple: ({ specs }) => new PSpec(f(new MultipleCase(specs.map((spec) => spec.transform(f))))),
      Test: (t) => new PSpec(f(t)),
    });
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec annotate
 */
export function annotate<V>(key: TestAnnotation<V>, value: V) {
  return <R, E, T>(self: PSpec<R, E, T>): PSpec<R, E, T> => {
    return self.transform(
      matchTag(
        {
          Test: ({ test, annotations }) => new TestCase(test, annotations.annotate(key, value)),
        },
        identity,
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec whenIO
 */
export function whenIO<R1, E1>(b: IO<R1, E1, boolean>) {
  return <R, E>(self: PSpec<R, E, TestSuccess>): PSpec<R | R1 | Annotations, E | E1, TestSuccess> => {
    return matchTag_(self.caseValue, {
      Exec: (c) => exec(c.spec.whenIO(b), c.exec),
      Labeled: ({ label, spec }) => Spec.labeled(spec.whenIO(b), label),
      Scoped: (c) => Spec.scoped(b.flatMap((b) => (b ? c.scoped : IO.succeedNow(Spec.empty)))),
      Multiple: ({ specs }) => Spec.multiple(specs.map((_) => _.whenIO(b))),
      Test: (c) =>
        Spec.test(
          b.flatMap((b) => IO.if(b, c.test, Annotations.annotate(TestAnnotation.Ignored, 1)).as(TestSuccess.Ignored)),
          c.annotations,
        ),
    });
  };
}

/**
 * @tsplus pipeable fncts.test.PSpec when
 */
export function when(b: Lazy<boolean>) {
  return <R, E>(self: PSpec<R, E, TestSuccess>): PSpec<R | Annotations, E, TestSuccess> => {
    return self.whenIO(IO.succeed(b));
  };
}
