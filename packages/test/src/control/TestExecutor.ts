import type { TestFailure } from "../data/TestFailure.js";
import type { TestSuccess } from "../data/TestSuccess.js";
import type { Annotated, Annotations } from "./Annotations.js";
import type { Spec, SpecCase } from "./Spec.js";
import type { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";

import { matchTag_ } from "@fncts/base/util/pattern";

import { ExecutedSpec } from "../data/ExecutedSpec.js";
import { TestAnnotationMap } from "../data/TestAnnotationMap.js";
import { RuntimeFailure } from "../data/TestFailure.js";

export interface TestExecutor<R> {
  readonly run: <E>(spec: Spec<R | Annotations, E>, defExec: ExecutionStrategy) => UIO<ExecutedSpec<E>>;
  readonly environment: Layer<unknown, never, R>;
}

export function defaultTestExecutor<R>(env: Layer<never, never, R | Annotations>): TestExecutor<R | Annotations> {
  return {
    run: <E>(spec: Spec<R | Annotations, E>, defExec: ExecutionStrategy): UIO<ExecutedSpec<E>> =>
      spec.annotated
        .provideLayer(env)
        .foreachExec(
          (cause): UIO<Annotated<Either<TestFailure<E>, TestSuccess>>> =>
            cause.failureOrCause.match(
              ([failure, annotations]) => IO.succeedNow([Either.left(failure), annotations]),
              (cause) => IO.succeedNow([Either.left(new RuntimeFailure(cause)), TestAnnotationMap.empty]),
            ),
          ([success, annotations]): UIO<Annotated<Either<TestFailure<E>, TestSuccess>>> =>
            IO.succeedNow([Either.right(success), annotations]),
          defExec,
        )
        .scoped.flatMap(
          (s) =>
            s.foldScoped(
              (spec: SpecCase<never, never, Annotated<Either<TestFailure<E>, TestSuccess>>, ExecutedSpec<E>>) =>
                matchTag_(spec, {
                  Exec: ({ spec }) => IO.succeedNow(spec),
                  Labeled: ({ label, spec }) => IO.succeedNow(ExecutedSpec.labeled(spec, label)),
                  Scoped: ({ scoped }) => scoped,
                  Multiple: ({ specs }) => IO.succeedNow(ExecutedSpec.multiple(specs)),
                  Test: ({ test, annotations }) =>
                    test.map(([result, dynamicAnnotations]) =>
                      ExecutedSpec.test(result, annotations.combine(dynamicAnnotations)),
                    ),
                }),
              defExec,
            ).scoped,
        ),
    environment: env,
  };
}
