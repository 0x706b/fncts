import { RunnableSpec } from "@fncts/test/control/RunnableSpec";
import { timeoutWarning } from "@fncts/test/control/TestAspect";
import { TestEnvironment } from "@fncts/test/control/TestEnvironment";
import { defaultTestExecutor } from "@fncts/test/control/TestExecutor";
import { TestRunner } from "@fncts/test/control/TestRunner";

const defaultTestRunner = new TestRunner(defaultTestExecutor(TestEnvironment));

export abstract class DefaultRunnableSpec extends RunnableSpec<TestEnvironment, any> {
  aspects = [timeoutWarning(60000)];
  runner  = defaultTestRunner;
}
