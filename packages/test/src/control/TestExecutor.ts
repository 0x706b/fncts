import type { TestFailure } from "../data/TestFailure.js";
import type { TestSuccess } from "../data/TestSuccess.js";
import type { Annotated, Annotations } from "./Annotations.js";
import type { Spec, SpecCase } from "./Spec.js";
import type { UIO } from "@fncts/base/control/IO";
import type { Layer } from "@fncts/base/control/Layer.js";
import type { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";
import type { Has } from "@fncts/base/prelude";

import { IO } from "@fncts/base/control/IO";
import { Managed } from "@fncts/base/control/Managed.js";
import { Either } from "@fncts/base/data/Either.js";
import { matchTag, matchTag_ } from "@fncts/base/util/pattern.js";

import { ExecutedSpec } from "../data/ExecutedSpec.js";
import { TestAnnotationMap } from "../data/TestAnnotationMap.js";
import { RuntimeFailure } from "../data/TestFailure.js";

export interface TestExecutor<R> {
  readonly run: <E>(
    spec: Spec<R & Has<Annotations>, E>,
    defExec: ExecutionStrategy,
  ) => UIO<ExecutedSpec<E>>;
  readonly environment: Layer<unknown, never, R>;
}

export function defaultTestExecutor<R>(
  env: Layer<unknown, never, R & Has<Annotations>>,
): TestExecutor<R & Has<Annotations>> {
  return {
    run: <E>(
      spec: Spec<R & Has<Annotations>, E>,
      defExec: ExecutionStrategy,
    ): UIO<ExecutedSpec<E>> =>
      spec.annotated
        .provideLayer(env)
        .foreachExec(
          (cause): UIO<Annotated<Either<TestFailure<E>, TestSuccess>>> =>
            cause.failureOrCause.match(
              ([failure, annotations]) => IO.succeedNow([Either.left(failure), annotations]),
              (cause) =>
                IO.succeedNow([Either.left(new RuntimeFailure(cause)), TestAnnotationMap.empty]),
            ),
          ([success, annotations]): UIO<Annotated<Either<TestFailure<E>, TestSuccess>>> =>
            IO.succeedNow([Either.right(success), annotations]),
          defExec,
        )
        .use(
          (s) =>
            s.foldManaged(
              (
                spec: SpecCase<
                  unknown,
                  never,
                  Annotated<Either<TestFailure<E>, TestSuccess>>,
                  ExecutedSpec<E>
                >,
              ) =>
                matchTag_(spec, {
                  Exec: ({ spec }) => Managed.succeedNow(spec),
                  Labeled: ({ label, spec }) =>
                    Managed.succeedNow(ExecutedSpec.labeled(spec, label)),
                  Managed: ({ managed }) => managed,
                  Multiple: ({ specs }) => Managed.succeedNow(ExecutedSpec.multiple(specs)),
                  Test: ({ test, annotations }) =>
                    test.map(([result, dynamicAnnotations]) =>
                      ExecutedSpec.test(result, annotations.combine(dynamicAnnotations)),
                    ).toManaged,
                }),
              defExec,
            ).useNow,
        ),
    environment: env,
  };
}
