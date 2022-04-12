import { suite, test } from "@fncts/test/api.js";
import { strictEqualTo } from "@fncts/test/control/Assertion.js";
import { DefaultRunnableSpec } from "@fncts/test/control/DefaultRunnableSpec.js";

export class TestSpec extends DefaultRunnableSpec {
  spec = suite("TestSpec", test("test", (0).assert(strictEqualTo(0))));
}

new TestSpec().main();