import { Annotations } from "@fncts/test/control/Annotations";
import { Live } from "@fncts/test/control/Live";
import { Data, Start, TestClock } from "@fncts/test/control/TestClock/definition";

/**
 * @tsplus static fncts.test.control.TestClockOps make
 */
export function make(
  data: Data,
): Layer<Has<Live> & Has<Annotations>, never, Has<Clock> & Has<TestClock>> {
  return Layer.scopedEnvironment(
    IO.gen(function* (_) {
      const live         = yield* _(IO.service(Live.Tag));
      const annotations  = yield* _(IO.service(Annotations.Tag));
      const ref          = yield* _(Ref.make(data));
      const synchronized = yield* _(Ref.Synchronized.make(Start));
      const test         = yield* _(
        IO.acquireRelease(
          IO.succeed(new TestClock(ref, live, annotations, synchronized)),
          (tc) => tc.warningDone,
        ),
      );
      return Environment().add(test, TestClock.Tag).add(test, Clock.Tag);
    }),
  );
}

/**
 * @tsplus static fncts.test.control.TestClockOps Live
 */
export const live: Layer<Has<Live> & Has<Annotations>, never, Has<Clock> & Has<TestClock>> =
  TestClock.make(new Data(0, Nil()));

/**
 * @tsplus static fncts.test.control.TestClockOps adjust
 */
export function adjust(duration: number): IO<Has<TestClock>, never, void> {
  return IO.serviceWithIO((service: TestClock) => service.adjust(duration), TestClock.Tag);
}
