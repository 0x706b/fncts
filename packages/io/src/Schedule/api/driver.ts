import { Driver } from "@fncts/io/Schedule/Driver";

/**
 * @tsplus getter fncts.io.Schedule driver
 */
export function driver<State, Env, In, Out>(
  schedule: Schedule.WithState<State, Env, In, Out>,
  __tsplusTrace?: string,
): UIO<Schedule.Driver<State, Env, In, Out>> {
  return Ref.make<readonly [Maybe<Out>, State]>([Nothing(), schedule.initial]).map((ref) => {
    const next = (inp: In, __tsplusTrace?: string) =>
      IO.gen(function* (_) {
        const state                   = yield* _(ref.get.map(([_, s]) => s));
        const now                     = yield* _(Clock.currentTime);
        const [state1, out, decision] = yield* _(schedule.step(now, inp, state));
        return yield* _(
          decision.match(
            () => ref.set([Just(out), state1]).apSecond(IO.failNow(Nothing() as Nothing)),
            (interval) =>
              ref
                .set([Just(out), state1])
                .apSecond(Clock.sleep(Duration.fromInterval(now, interval.startMilliseconds)))
                .as(out),
          ),
        );
      });

    const last = ref.get.flatMap(([mOut, _]) =>
      mOut.match(() => IO.failNow(new NoSuchElementError("There is no value left")), IO.succeedNow),
    );

    const reset = ref.set([Nothing(), schedule.initial]);

    const state = ref.get.map(([_, state]) => state);

    return Driver(next, last, reset, state);
  });
}
