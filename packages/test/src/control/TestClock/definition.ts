import type { FiberStatus } from "@fncts/io/FiberStatus";
import type { Annotations } from "@fncts/test/control/Annotations";
import type { Live } from "@fncts/test/control/Live";

import { matchTag } from "@fncts/base/util/pattern";
import { Console } from "@fncts/io/Console";
import { TestAnnotation } from "@fncts/test/data/TestAnnotation";

export class Data {
  constructor(readonly duration: number, readonly sleeps: List<readonly [number, Future<never, void>]>) {}
}

export class Sleep {
  constructor(readonly duration: number, readonly promise: Future<never, void>, readonly fiberId: FiberId) {}
}

interface Start {
  readonly _tag: "Start";
}

interface Pending {
  readonly _tag: "Pending";
  readonly fiber: Fiber<never, void>;
}

interface Done {
  readonly _tag: "Done";
}

type WarningData = Start | Pending | Done;

export const Start: WarningData = { _tag: "Start" };

export const Pending = (fiber: Fiber<never, void>): WarningData => ({ _tag: "Pending", fiber });

export const Done: WarningData = { _tag: "Done" };

const warning =
  "Warning: A test is using time, but is not advancing the test clock, " +
  "which may result in the test hanging. Use TestClock.adjust to " +
  "manually advance the time.";

/**
 * @tsplus static fncts.test.TestClockOps Tag
 */
export const TestClockTag = Tag<TestClock>();

/**
 * @tsplus type fncts.test.TestClock
 * @tsplus companion fncts.test.TestClockOps
 */
export class TestClock extends Clock {
  constructor(
    readonly clockState: Ref<Data>,
    readonly live: Live,
    readonly annotations: Annotations,
    readonly warningState: Ref.Synchronized<WarningData>,
  ) {
    super();
  }
  sleep = (ms: number) => {
    const self = this;
    return IO.gen(function* (_) {
      const promise = yield* _(Future.make<never, void>());
      const wait    = yield* _(
        self.clockState.modify((data) => {
          const end = data.duration + ms;
          if (end > data.duration) {
            return [true, new Data(data.duration, data.sleeps.prepend([end, promise]))];
          } else {
            return [false, data];
          }
        }),
      );
      yield* _(
        IO.defer(() => {
          if (wait) {
            return self.warningStart > promise.await;
          } else {
            return promise.succeed(undefined) > IO.unit;
          }
        }),
      );
    });
  };

  currentTime = this.clockState.get.map((data) => data.duration);

  adjust(duration: number): UIO<void> {
    return this.warningDone > this.run((d) => d + duration);
  }

  setDate(date: Date): UIO<void> {
    return this.setTime(date.getTime());
  }

  setTime(time: number): UIO<void> {
    return this.warningDone > this.run((_) => time);
  }

  sleeps = this.clockState.get.map((data) => data.sleeps.map(([_]) => _));

  get supervizedFibers(): UIO<HashSet<Fiber.Runtime<any, any>>> {
    return IO.descriptorWith((descriptor) =>
      this.annotations.get(TestAnnotation.Fibers).flatMap((_) =>
        _.match(
          (_) => IO.succeed(HashSet.makeDefault()),
          (fibers) =>
            IO.foreach(fibers, (ref) => ref.get)
              .map((_) => _.foldLeft(HashSet.makeDefault<Fiber.Runtime<any, any>>(), (s0, s1) => s0.union(s1)))
              .map((set) => set.filter((f) => !Equatable.strictEquals(f.id, descriptor.id))),
        ),
      ),
    );
  }

  private get freeze(): IO<unknown, void, HashMap<FiberId, FiberStatus>> {
    return this.supervizedFibers.flatMap((fibers) =>
      IO.foldLeft(fibers, HashMap.makeDefault<FiberId, FiberStatus>(), (map, fiber) =>
        fiber.status.flatMap((status) => {
          switch (status._tag) {
            case "Done": {
              return IO.succeed(map.set(fiber.id, status));
            }
            case "Suspended": {
              return IO.succeed(map.set(fiber.id, status));
            }
            default: {
              return IO.fail(undefined);
            }
          }
        }),
      ),
    );
  }

  private get delay(): UIO<void> {
    return this.live.provide(Clock.sleep(5));
  }

  private get awaitSuspended(): UIO<void> {
    return this.suspended
      .zipWith(this.live.provide(Clock.sleep(10)) > this.suspended, Equatable.strictEquals)
      .filterOrFail(Function.identity, (): void => undefined).eventually.asUnit;
  }

  private run(f: (duration: number) => number): UIO<void> {
    return (
      this.awaitSuspended >
      this.clockState.modify((data) => {
        const end    = f(data.duration);
        const sorted = data.sleeps.sortWith(([x], [y]) => Number.Ord.compare_(x, y));
        return sorted.head
          .flatMap(([duration, promise]) =>
            duration <= end
              ? Just([Just([end, promise] as const), new Data(duration, sorted.unsafeTail)] as const)
              : Nothing(),
          )
          .getOrElse([Nothing(), new Data(end, data.sleeps)] as const);
      })
    ).flatMap((_) =>
      _.match(
        () => IO.unit,
        ([end, promise]) => promise.succeed(undefined) > IO.yieldNow > this.run(() => end),
      ),
    );
  }

  private get suspended(): IO<unknown, void, HashMap<FiberId, FiberStatus>> {
    return this.freeze.zip(this.delay > this.freeze).flatMap(([first, last]) => {
      if (Equatable.strictEquals(first, last)) {
        return IO.succeedNow(first);
      } else {
        return IO.failNow(undefined);
      }
    });
  }

  warningDone: UIO<void> = this.warningState.updateJustIO(
    matchTag({
      Start: () => Just(IO(Done)),
      Pending: ({ fiber }) => Just(fiber.interrupt.as(Done)),
      Done: () => Nothing(),
    }),
  );

  private warningStart: UIO<void> = this.warningState.updateJustIO(
    matchTag(
      {
        Start: () =>
          Just(this.live.provide(Clock.sleep(5000) > Console.print(warning)).interruptible.fork.map(Pending)),
      },
      () => Nothing<IO<unknown, never, WarningData>>(),
    ),
  );
}
