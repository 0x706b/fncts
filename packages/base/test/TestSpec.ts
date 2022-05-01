class TestSpec extends DefaultRunnableSpec {
  spec = suite("TestSpec", test("test", (0).assert(strictEqualTo(0))));
}

export default new TestSpec();
