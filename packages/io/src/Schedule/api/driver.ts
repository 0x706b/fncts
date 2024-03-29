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
      Do((_) => {
        const state                   = _(ref.get.map(([_, s]) => s));
        const now                     = _(Clock.currentTime);
        const [state1, out, decision] = _(schedule.step(now, inp, state));
        return _(
          decision.match(
            () => ref.set([Just(out), state1]).zipRight(IO.failNow(Nothing() as Nothing)),
            (interval) =>
              ref
                .set([Just(out), state1])
                .zipRight(Clock.sleep(Duration.fromInterval(now, interval.start)))
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
