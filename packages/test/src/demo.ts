import { DefaultRunnableSpec } from "@fncts/test/control/DefaultRunnableSpec";

import { suite, test } from "./api.js";
import { strictEqualTo } from "./control/Assertion.js";

const ServiceATag = Tag<{
  x: number;
}>("fncts.test.demo.ServiceA");

class DemoSpec extends DefaultRunnableSpec {
  spec = suite(
    "TestSuite",
    test("Demo success", (0).assert(strictEqualTo(0))),
    test("Demo failure", { a: { b: { c: { d: 100 } } } }.assert(strictEqualTo({ a: { b: { c: { d: 0 } } } }))),
  );
}
new DemoSpec().run().unsafeRunFiber();
