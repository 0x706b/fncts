import { suite, test } from "@fncts/test/api";
import { strictEqualTo } from "@fncts/test/control/Assertion";
import { DefaultRunnableSpec } from "@fncts/test/control/DefaultRunnableSpec";

class TestSpec extends DefaultRunnableSpec {
  spec = suite("TestSpec", test("test", (0).assert(strictEqualTo(0))));
}

export default new TestSpec();