import { IOEnv } from "@fncts/io/IOEnv";
import { Annotations } from "@fncts/test/control/Annotations";
import { Live } from "@fncts/test/control/Live";
import { Data, Start, TestClock } from "@fncts/test/control/TestClock/definition";

/**
 * @tsplus static fncts.test.TestClockOps make
 */
export function make(data: Data): Layer<Has<Live> & Has<Annotations>, never, Has<TestClock>> {
  return Layer.scoped(
    IO.gen(function* (_) {
      const live         = yield* _(IO.service(Live.Tag));
      const annotations  = yield* _(IO.service(Annotations.Tag));
      const ref          = yield* _(Ref.make(data));
      const synchronized = yield* _(Ref.Synchronized.make(Start));
      const test         = yield* _(
        IO.acquireRelease(IO.succeed(new TestClock(ref, live, annotations, synchronized)), (tc) => tc.warningDone),
      );
      yield* _(IOEnv.services.locallyScopedWith((_) => _.add(test, TestClock.Tag)));
      return test;
    }),
    TestClock.Tag,
  );
}

/**
 * @tsplus static fncts.test.TestClockOps Live
 */
export const live: Layer<Has<Live> & Has<Annotations>, never, Has<TestClock>> = TestClock.make(new Data(0, Nil()));

/**
 * @tsplus static fncts.test.TestClockOps adjust
 */
export function adjust(duration: number): IO<Has<TestClock>, never, void> {
  return IO.serviceWithIO((service: TestClock) => service.adjust(duration), TestClock.Tag);
}
