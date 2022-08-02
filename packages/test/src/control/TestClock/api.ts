import { IOEnv } from "@fncts/io/IOEnv";
import { Annotations } from "@fncts/test/control/Annotations";
import { Live } from "@fncts/test/control/Live";
import { Data, Start, TestClock } from "@fncts/test/control/TestClock/definition";

/**
 * @tsplus static fncts.test.TestClockOps make
 */
export function make(data: Data): Layer<Live | Annotations, never, TestClock> {
  return Layer.scoped(
    Do((_) => {
      const live         = _(IO.service(Live.Tag));
      const annotations  = _(IO.service(Annotations.Tag));
      const ref          = _(Ref.make(data));
      const synchronized = _(Ref.Synchronized.make(Start));
      const test         = _(
        IO.acquireRelease(IO.succeed(new TestClock(ref, live, annotations, synchronized)), (tc) => tc.warningDone),
      );
      _(IOEnv.services.locallyScopedWith((_) => _.add(test, TestClock.Tag)));
      return test;
    }),
    TestClock.Tag,
  );
}

/**
 * @tsplus static fncts.test.TestClockOps Live
 */
export const live: Layer<Live | Annotations, never, TestClock> = TestClock.make(new Data(0, Nil()));

/**
 * @tsplus static fncts.test.TestClockOps adjust
 */
export function adjust(duration: number): IO<TestClock, never, void> {
  return IO.serviceWithIO((service: TestClock) => service.adjust(duration), TestClock.Tag);
}
