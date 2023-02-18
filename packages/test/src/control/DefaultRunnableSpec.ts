import { AbstractRunnableSpec } from "@fncts/test/control/AbstractRunnableSpec";
import { timeoutWarning } from "@fncts/test/control/TestAspect";
import { TestEnvironment } from "@fncts/test/control/TestEnvironment";

export abstract class DefaultRunnableSpec extends AbstractRunnableSpec<TestEnvironment, any> {
  aspects = [timeoutWarning((1).minutes)];
  bootstrap: Layer<never, never, TestEnvironment> = TestEnvironment;
}
