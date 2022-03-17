import { Console, LiveConsole } from "@fncts/base/control/Console.js";
import { FiberRef } from "@fncts/base/control/FiberRef";
import { IO } from "@fncts/base/control/IO";
import { Layer } from "@fncts/base/control/Layer";
import { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";

import { assert_, assertIO_, suite, test, testIO } from "./api.js";
import { Annotations, LiveAnnotations } from "./control/Annotations.js";
import { strictEqualTo } from "./control/Assertion.js";
import { report } from "./control/DefaultTestReporter/render.js";
import { TestAnnotationRenderer } from "./control/TestAnnotationRenderer.js";
import { defaultTestExecutor } from "./control/TestExecutor.js";
import { TestLogger } from "./control/TestLogger.js";
import { TestAnnotationMap } from "./data/TestAnnotationMap.js";

const spec = suite(
  "TestSuite",
  test("Demo success", assert_(0, strictEqualTo(0))),
  test("Demo failure", assert_(0, strictEqualTo(100))),
  testIO(
    "Demo IO",
    assertIO_(
      IO.environmentWith((_: { x: number }) => _.x),
      strictEqualTo(10),
    ),
  ),
);

const liveAnnotations = Layer.fromIO(Annotations.Tag)(
  FiberRef.make(TestAnnotationMap.empty).map((ref) => new LiveAnnotations(ref)),
);

const env = Layer.fromRawIO(IO.succeedNow({ x: 10 }))
  .and(liveAnnotations)
  .and(TestLogger.fromConsole)
  .using(Layer.fromIO(Console.Tag)(IO.succeedNow(new LiveConsole())));

const executor = defaultTestExecutor(env);

const reporter = report(TestAnnotationRenderer.Default);

executor
  .run(spec, ExecutionStrategy.concurrentBounded(10))
  .chain((executedSpec) => reporter(0, executedSpec))
  .provideLayer(env)
  .unsafeRunWith((exit) => {
    console.log(exit);
  });
