import { Console, LiveConsole } from "@fncts/base/control/Console.js";

import { suite, test, testIO } from "./api.js";
import { Annotations, LiveAnnotations } from "./control/Annotations.js";
import { strictEqualTo } from "./control/Assertion.js";
import { report } from "./control/DefaultTestReporter/render.js";
import { TestAnnotationRenderer } from "./control/TestAnnotationRenderer.js";
import { defaultTestExecutor } from "./control/TestExecutor.js";
import { TestLogger } from "./control/TestLogger.js";
import { ConsoleRenderer } from "./control/TestRenderer/ConsoleRenderer.js";
import { TestAnnotationMap } from "./data/TestAnnotationMap.js";

const ServiceATag = Tag<{ x: number }>(Symbol());

const spec = suite(
  "TestSuite",
  test("Demo success", (0).assert(strictEqualTo(0))),
  test(
    "Demo failure",
    { a: { b: { c: { d: 100 } } } }.assert(strictEqualTo({ a: { b: { c: { d: 0 } } } })),
  ),
  testIO(
    "Demo IO",
    IO.environmentWith((_: Environment<Has<{ x: number }>>) => _.get(ServiceATag).x).assert(
      strictEqualTo(10),
    ),
  ),
);

const liveAnnotations = Layer.fromIO(
  FiberRef.make(TestAnnotationMap.empty).map((ref) => new LiveAnnotations(ref)),
  Annotations.Tag,
);

const env = Layer.succeed({ x: 10 }, ServiceATag)
  .and(liveAnnotations)
  .and(TestLogger.fromConsole)
  .using(Layer.fromIO(IO.succeedNow(new LiveConsole()), Console.Tag));

const executor = defaultTestExecutor(env);

const reporter = report(new ConsoleRenderer(), TestAnnotationRenderer.Default);

executor
  .run(spec, ExecutionStrategy.concurrentBounded(10))
  .chain((executedSpec) => reporter(0, executedSpec))
  .provideLayer(env)
  .unsafeRunWith((exit) => {
    console.log(exit);
  });
