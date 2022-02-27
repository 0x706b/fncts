import type { Maybe } from "../../data/Maybe";
import type { Has } from "../../prelude";
import type { UIO, URIO } from "../IO";
import type { Schedule } from "../Schedule/definition";

import { NoSuchElementError } from "../../data/exceptions";
import { Just, Nothing } from "../../data/Maybe";
import { tag } from "../../data/Tag";
import { IO } from "../IO";
import { Ref } from "../Ref";
import { Driver } from "../Schedule/Driver";

/**
 * @tsplus type fncts.control.Clock
 * @tsplus companion fncts.control.ClockOps
 */
export abstract class Clock {
  abstract readonly currentTime: UIO<number>;
  abstract sleep(duration: number, __tsplusTrace?: string): UIO<void>;
  driver<State, Env, In, Out>(
    schedule: Schedule.WithState<State, Env, In, Out>,
    __tsplusTrace?: string,
  ): UIO<Schedule.Driver<State, Env, In, Out>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Ref.make<readonly [Maybe<Out>, State]>([Nothing(), schedule.initial]).map((ref) => {
      const next = (inp: In, __tsplusTrace?: string) =>
        IO.gen(function* (_) {
          const state                   = yield* _(ref.get.map(([_, s]) => s));
          const now                     = yield* _(self.currentTime);
          const [state1, out, decision] = yield* _(schedule.step(now, inp, state));
          return yield* _(
            decision.match(
              () => ref.set([Just(out), state1]).apSecond(IO.failNow(Nothing() as Nothing)),
              (interval) =>
                ref
                  .set([Just(out), state1])
                  .apSecond(self.sleep(interval.startMilliseconds - now))
                  .as(out),
            ),
          );
        });

      const last = ref.get.chain(([mOut, _]) =>
        mOut.match(() => IO.failNow(new NoSuchElementError("There is no value left")), IO.succeedNow),
      );

      const reset = ref.set([Nothing(), schedule.initial]);

      const state = ref.get.map(([_, state]) => state);

      return Driver(next, last, reset, state);
    });
  }
}

/**
 * @tsplus static fncts.control.ClockOps Tag
 */
export const ClockTag = tag<Clock>();

/**
 * @tsplus static fncts.control.ClockOps currentTime
 */
export const currentTime = IO.asksServiceIO(Clock.Tag)((clock) => clock.currentTime);

/**
 * @tsplus static fncts.control.ClockOps driver
 * @tsplus getter fncts.control.Schedule driver
 */
export function driver<State, Env, In, Out>(
  schedule: Schedule.WithState<State, Env, In, Out>,
): URIO<Has<Clock>, Schedule.Driver<State, Env, In, Out>> {
  return IO.asksServiceIO(ClockTag)((clock) => clock.driver(schedule));
}

/**
 * @tsplus static fncts.control.ClockOps sleep
 */
export function sleep(duration: number, __tsplusTrace?: string): URIO<Has<Clock>, void> {
  return IO.asksServiceIO(Clock.Tag)((clock) => clock.sleep(duration));
}
