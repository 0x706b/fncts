import { IO } from "@fncts/io/IO";
import { suite, test } from "@fncts/test/api.js";
import { strictEqualTo } from "@fncts/test/control/Assertion.js";
import { DefaultRunnableSpec } from "@fncts/test/control/DefaultRunnableSpec.js";
import Benchmark from "benchmark";

export class TestSpec extends DefaultRunnableSpec {
  spec = suite("TestSpec", test("test", (0).assert(strictEqualTo(0))));
}
const spec = new TestSpec()
const effect = spec._run.provideSomeLayer(spec.runner.bootstrap)

new Benchmark.Suite("Test")
  .add("effect", {
    defer: true,
    fn: (defer: any) => effect.unsafeRunAsyncWith(() => {
      defer.resolve()
    })
  })
  .on("cycle", (event: any) => {
    console.log(String(event.target));
  })
  .run();
