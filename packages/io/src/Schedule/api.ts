import { Decision, DecisionTag } from "./Decision.js";

/**
 * @tsplus static fncts.io.ScheduleOps __call
 */
export function make<State, Env, In, Out>(
  initial: State,
  step: (now: number, inp: In, state: State, __tsplusTrace?: string) => IO<Env, never, readonly [State, Out, Decision]>,
  __tsplusTrace?: string,
): Schedule.WithState<State, Env, In, Out> {
  return new (class extends Schedule<Env, In, Out> {
    readonly _State!: State;
    initial = initial;
    step = step;
  })();
}

/**
 * @tsplus pipeable fncts.io.Schedule addDelay
 */
export function addDelay<Out>(f: (out: Out) => number, __tsplusTrace?: string) {
  return <State, Env, In>(self: Schedule.WithState<State, Env, In, Out>): Schedule.WithState<State, Env, In, Out> => {
    return self.addDelayIO((out) => IO.succeed(f(out)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule addDelayIO
 */
export function addDelayIO<Out, Env1>(f: (out: Out) => URIO<Env1, number>, __tsplusTrace?: string) {
  return <State, Env, In>(
    self: Schedule.WithState<State, Env, In, Out>,
  ): Schedule.WithState<State, Env | Env1, In, Out> => {
    return self.modifyDelayIO((out, duration) => f(out).map((d) => duration + d));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule andThen
 */
export function andThen<State1, Env1, In1, Out1>(
  that: Schedule.WithState<State1, Env1, In1, Out1>,
  __tsplusTrace?: string,
) {
  return <State, Env, In, Out>(
    self: Schedule.WithState<State, Env, In, Out>,
  ): Schedule.WithState<readonly [State, State1, boolean], Env | Env1, In & In1, Out | Out1> => {
    return self.andThenEither(that).map((out) => out.value);
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule andThenEither
 */
export function andThenEither<State1, Env1, In1, Out1>(
  that: Schedule.WithState<State1, Env1, In1, Out1>,
  __tsplusTrace?: string,
) {
  return <State, Env, In, Out>(
    self: Schedule.WithState<State, Env, In, Out>,
  ): Schedule.WithState<readonly [State, State1, boolean], Env | Env1, In & In1, Either<Out, Out1>> => {
    return Schedule<readonly [State, State1, boolean], Env | Env1, In & In1, Either<Out, Out1>>(
      [self.initial, that.initial, true],
      (now, inp, [s1, s2, onLeft]) => {
        if (onLeft) {
          return self.step(now, inp, s1).flatMap(([lState, out, decision]) =>
            decision.match(
              () =>
                that
                  .step(now, inp, s2)
                  .map(([rState, out, decision]) => [[lState, rState, false], Either.right(out), decision]),
              (interval) => IO.succeedNow([[lState, s2, true], Either.left(out), Decision.Continue(interval)]),
            ),
          );
        } else {
          return that
            .step(now, inp, s2)
            .map(([rState, out, decision]) => [[s1, rState, false], Either.right(out), decision]);
        }
      },
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule as
 */
export function as<Out2>(out2: Lazy<Out2>, __tsplusTrace?: string) {
  return <State, Env, In, Out>(
    self: Schedule.WithState<State, Env, In, Out>,
  ): Schedule.WithState<State, Env, In, Out2> => {
    return self.map(() => out2());
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule check
 */
export function check<In, Out>(test: (inp: In, out: Out) => boolean, __tsplusTrace?: string) {
  return <State, Env>(self: Schedule.WithState<State, Env, In, Out>): Schedule.WithState<State, Env, In, Out> => {
    return self.checkIO((inp, out) => IO.succeed(test(inp, out)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule checkIO
 */
export function checkIO<In, Out, Env1>(test: (inp: In, out: Out) => URIO<Env1, boolean>, __tsplusTrace?: string) {
  return <State, Env>(
    self: Schedule.WithState<State, Env, In, Out>,
  ): Schedule.WithState<State, Env | Env1, In, Out> => {
    return Schedule(self.initial, (now, inp, state) =>
      self.step(now, inp, state).flatMap(([state, out, decision]) =>
        decision.match(
          () => IO.succeedNow([state, out, decision]),
          (interval) =>
            test(inp, out).map((b) => (b ? [state, out, Decision.Continue(interval)] : [state, out, Decision.Done])),
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule compose_
 */
export function compose<O, S1, R1, O2>(that: Schedule.WithState<S1, R1, O, O2>, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<readonly [S, S1], R | R1, I, O2> => {
    return Schedule([self.initial, that.initial], (now, inp, state) =>
      self.step(now, inp, state[0]).flatMap(([lState, out, decision]) =>
        decision.match(
          () => that.step(now, out, state[1]).map(([rState, out2]) => [[lState, rState], out2, Decision.Done]),
          (interval) =>
            that.step(now, out, state[1]).map(([rState, out2, decision]) =>
              decision.match(
                () => [[lState, rState], out2, Decision.Done],
                (interval2) => [[lState, rState], out2, Decision.Continue(interval.max(interval2))],
              ),
            ),
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule contramap
 */
export function contramap<I, I2>(f: (inp: I2) => I, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I2, O> => {
    return self.contramapIO((inp2) => IO.succeed(f(inp2)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule contramapEnvironment
 */
export function contramapEnvironment<R, R1>(f: (env: Environment<R1>) => Environment<R>, __tsplusTrace?: string) {
  return <S, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R1, I, O> => {
    return Schedule(self.initial, (now, inp, state) => self.step(now, inp, state).contramapEnvironment(f));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule contramapIO
 */
export function contramapIO<I, R1, I2>(f: (inp: I2) => URIO<R1, I>, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I2, O> => {
    return Schedule(self.initial, (now, inp2, state) => f(inp2).flatMap((inp) => self.step(now, inp, state)));
  };
}

/**
 * @tsplus static fncts.io.ScheduleOps delayed
 */
export function delayed<S, R, I>(
  schedule: Schedule.WithState<S, R, I, number>,
  __tsplusTrace?: string,
): Schedule.WithState<S, R, I, number> {
  return schedule.addDelay((x) => x);
}

/**
 * @tsplus pipeable fncts.io.Schedule delayed
 */
export function delayedSelf(f: (delay: number) => number, __tsplusTrace?: string) {
  return <S, R, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> => {
    return self.delayedIO((delay) => IO.succeed(f(delay)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule delayedIO
 */
export function delayedIO<R1>(f: (delay: number) => URIO<R1, number>, __tsplusTrace?: string) {
  return <S, R, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return self.modifyDelayIO((_, delay) => f(delay));
  };
}

/**
 * @tsplus getter fncts.io.Schedule delays
 */
export function delays<S, R, I, O>(
  self: Schedule.WithState<S, R, I, O>,
  __tsplusTrace?: string,
): Schedule.WithState<S, R, I, number> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).flatMap(([state, _, decision]) =>
      decision.match(
        () => IO.succeedNow([state, 0, Decision.Done]),
        (interval) => {
          const delay = interval.start - now;
          return IO.succeedNow([state, delay, Decision.Continue(interval)]);
        },
      ),
    ),
  );
}

/**
 * @tsplus pipeable fncts.io.Schedule dimap
 */
export function dimap<I, O, I2, O2>(f: (inp2: I2) => I, g: (out: O) => O2, __tsplusTrace?: string) {
  return <S, R>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I2, O2> => {
    return self.contramap(f).map(g);
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule dimapIO
 */
export function dimapIO<I, O, R1, I2, R2, O2>(
  f: (inp2: I2) => URIO<R1, I>,
  g: (out: O) => URIO<R2, O2>,
  __tsplusTrace?: string,
) {
  return <S, R>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1 | R2, I2, O2> => {
    return self.contramapIO(f).mapIO(g);
  };
}

/**
 * @tsplus static fncts.io.ScheduleOps duration
 */
export function duration(
  duration: number,
  __tsplusTrace?: string,
): Schedule.WithState<boolean, never, unknown, number> {
  return Schedule<boolean, never, unknown, number>(true, (now, _, state) =>
    IO.succeed(() => {
      if (state) {
        const interval = Interval.after(now + duration);
        return [false, duration, Decision.continueWith(interval)];
      } else {
        return [false, 0, Decision.Done];
      }
    }),
  );
}

/**
 * @tsplus pipeable fncts.io.Schedule either
 * @tsplus pipeable-operator fncts.io.Schedule ||
 */
export function either<S1, R1, I1, O1>(that: Schedule.WithState<S1, R1, I1, O1>, __tsplusTrace?: string) {
  return <S, R, I, O>(
    self: Schedule.WithState<S, R, I, O>,
  ): Schedule.WithState<readonly [S, S1], R | R1, I & I1, readonly [O, O1]> => {
    return self.unionWith(that, (interval1, interval2) => interval1 || interval2);
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule eitherWith
 */
export function eitherWith<O, S1, R1, I1, O1, O2>(
  that: Schedule.WithState<S1, R1, I1, O1>,
  f: (out1: O, out2: O1) => O2,
  __tsplusTrace?: string,
) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<readonly [S, S1], R | R1, I & I1, O2> => {
    return (self || that).map(f.tupled);
  };
}

/**
 * @tsplus static fncts.io.ScheduleOps elapsed
 */
export const elapsed: Schedule.WithState<Maybe<number>, never, unknown, number> = Schedule(Nothing(), (now, _, state) =>
  IO.succeed(
    state.match(
      () => [Just(now), 0, Decision.continueWith(Interval(now, Number.MAX_SAFE_INTEGER))],
      (start) => {
        const duration = now - start;
        return [Just(start), duration, Decision.continueWith(Interval(now, Number.MAX_SAFE_INTEGER))];
      },
    ),
  ),
);

/**
 * @tsplus pipeable fncts.io.Schedule ensuring
 */
export function ensuring(finalizer: UIO<any>, __tsplusTrace?: string) {
  return <S, R, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> => {
    return Schedule(self.initial, (now, inp, state) =>
      self.step(now, inp, state).flatMap(([state, out, decision]) =>
        decision.match(
          () => finalizer.as([state, out, Decision.Done]),
          (interval) => IO.succeedNow([state, out, Decision.Continue(interval)]),
        ),
      ),
    );
  };
}

/**
 * @tsplus static fncts.io.ScheduleOps exponential
 */
export function exponential(
  base: number,
  factor = 2,
  __tsplusTrace?: string,
): Schedule.WithState<number, never, unknown, number> {
  return Schedule.delayed(Schedule.forever.map((i) => base * Math.pow(factor, i)));
}

/**
 * A schedule that recurs on a fixed interval. Returns the number of
 * repetitions of the schedule so far.
 *
 * If the action run between updates takes longer than the interval, then the
 * action will be run immediately, but re-runs will not "pile up".
 *
 * ```
 * |-----interval-----|-----interval-----|-----interval-----|
 * |---------action--------||action|-----|action|-----------|
 * ```
 *
 * @tsplus static fncts.io.ScheduleOps fixed
 */
export function fixed(
  interval: number,
  __tsplusTrace?: string,
): Schedule.WithState<readonly [Maybe<readonly [number, number]>, number], never, unknown, number> {
  return Schedule([Nothing(), 0], (now, inp, [ms, n]) =>
    IO.succeed(
      ms.match(
        () => {
          const nextRun = now + interval;
          return [[Just([now, nextRun]), n + 1], n, Decision.continueWith(Interval.after(nextRun))];
        },
        ([startMillis, lastRun]) => {
          const runningBehind = now > lastRun + interval;
          const boundary      = interval === 0 ? interval : interval - ((now - startMillis) % interval);
          const sleepTime     = boundary === 0 ? interval : boundary;
          const nextRun       = runningBehind ? now : now + sleepTime;
          return [[Just([startMillis, nextRun]), n + 1], n, Decision.continueWith(Interval.after(nextRun))];
        },
      ),
    ),
  );
}

/**
 * @tsplus pipeable fncts.io.Schedule fold
 */
export function fold<O, Z>(z: Z, f: (z: Z, out: O) => Z, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<readonly [S, Z], R, I, Z> => {
    return self.foldIO(z, (z, out) => IO.succeed(f(z, out)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule foldIO
 */
export function foldIO<O, Z, R1>(z: Z, f: (z: Z, out: O) => URIO<R1, Z>, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<readonly [S, Z], R | R1, I, Z> => {
    return Schedule([self.initial, z], (now, inp, [s, z]) =>
      self.step(now, inp, s).flatMap(([s, out, decision]) =>
        decision.match(
          () => IO.succeedNow([[s, z], z, Decision.Done]),
          (interval) => f(z, out).map((z2) => [[s, z2], z, Decision.Continue(interval)]),
        ),
      ),
    );
  };
}

/**
 * @tsplus getter fncts.io.Schedule forever
 */
export function repeatForever<S, R, I, O>(
  self: Schedule.WithState<S, R, I, O>,
  __tsplusTrace?: string,
): Schedule.WithState<S, R, I, O> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).flatMap(([state, out, decision]) =>
      decision.match(
        () => self.step(now, inp, self.initial),
        (interval) => IO.succeed([state, out, Decision.Continue(interval)]),
      ),
    ),
  );
}

/**
 * @tsplus static fncts.io.ScheduleOps forever
 */
export const forever = Schedule.unfold(0, (n) => n + 1);

/**
 * @tsplus static fncts.io.ScheduleOps identity
 */
export function identity<A>(__tsplusTrace?: string): Schedule.WithState<void, never, A, A> {
  return Schedule(undefined, (now, inp, state) => IO.succeed([state, inp, Decision.continueWith(Interval.after(now))]));
}

function intersectWithLoop<S, R, I, O, S1, R1, I1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O1>,
  inp: I & I1,
  lState: S,
  out: O,
  lInterval: Intervals,
  rState: S1,
  out2: O1,
  rInterval: Intervals,
  f: (lInterval: Intervals, rInterval: Intervals) => Intervals,
  __tsplusTrace?: string,
): IO<R | R1, never, readonly [readonly [S, S1], readonly [O, O1], Decision]> {
  const combined = f(lInterval, rInterval);
  if (combined.isNonEmpty) {
    return IO.succeedNow([[lState, rState], [out, out2], Decision.Continue(combined)]);
  } else if (lInterval < rInterval) {
    return self.step(lInterval.end, inp, lState).flatMap(([lState, out, decision]) =>
      decision.match(
        () => IO.succeedNow([[lState, rState], [out, out2], Decision.Done]),
        (lInterval) => intersectWithLoop(self, that, inp, lState, out, lInterval, rState, out2, rInterval, f),
      ),
    );
  } else {
    return that.step(rInterval.end, inp, rState).flatMap(([rState, out2, decision]) =>
      decision.match(
        () => IO.succeedNow([[lState, rState], [out, out2], Decision.Done]),
        (rInterval) => intersectWithLoop(self, that, inp, lState, out, lInterval, rState, out2, rInterval, f),
      ),
    );
  }
}

/**
 * @tsplus pipeable fncts.io.Schedule intersectWith
 */
export function intersectWith<S1, R1, I1, O1>(
  that: Schedule.WithState<S1, R1, I1, O1>,
  f: (int1: Intervals, int2: Intervals) => Intervals,
  __tsplusTrace?: string,
) {
  return <S, R, I, O>(
    self: Schedule.WithState<S, R, I, O>,
  ): Schedule.WithState<readonly [S, S1], R | R1, I & I1, readonly [O, O1]> => {
    return Schedule([self.initial, that.initial] as const, (now, inp, state) => {
      const left  = self.step(now, inp, state[0]);
      const right = that.step(now, inp, state[1]);
      return left.zipWith(right, ([lState, out, lDecision], [rState, out2, rDecision]) => {
        if (lDecision._tag === DecisionTag.Continue && rDecision._tag === DecisionTag.Continue) {
          return intersectWithLoop(
            self,
            that,
            inp,
            lState,
            out,
            lDecision.interval,
            rState,
            out2,
            rDecision.interval,
            f,
          );
        } else {
          return IO.succeedNow([[lState, rState], [out, out2], Decision.Done] as const);
        }
      }).flatten;
    });
  };
}

/**
 * @tsplus static fncts.io.Schedule linear
 */
export function linear(base: number, __tsplusTrace?: string): Schedule.WithState<number, never, unknown, number> {
  return Schedule.delayed(Schedule.forever.map((i) => base * (i + 1)));
}

/**
 * @tsplus pipeable fncts.io.Schedule map
 */
export function map<Out, Out1>(f: (out: Out) => Out1, __tsplusTrace?: string) {
  return <State, Env, In>(self: Schedule.WithState<State, Env, In, Out>): Schedule.WithState<State, Env, In, Out1> => {
    return self.mapIO((out) => IO.succeedNow(f(out)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule mapIO
 */
export function mapIO<Out, Env1, Out1>(f: (out: Out) => URIO<Env1, Out1>, __tsplusTrace?: string) {
  return <State, Env, In>(
    self: Schedule.WithState<State, Env, In, Out>,
  ): Schedule.WithState<State, Env | Env1, In, Out1> => {
    return Schedule(self.initial, (now, inp, state) =>
      self.step(now, inp, state).flatMap(([state, out, decision]) => f(out).map((out1) => [state, out1, decision])),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule modifyDelayIO
 */
export function modifyDelayIO<Out, Env1>(
  f: (out: Out, duration: number) => URIO<Env1, number>,
  __tsplusTrace?: string,
) {
  return <State, Env, In>(
    self: Schedule.WithState<State, Env, In, Out>,
  ): Schedule.WithState<State, Env | Env1, In, Out> => {
    return Schedule(self.initial, (now, inp, state) =>
      self.step(now, inp, state).flatMap(([state, out, decision]) =>
        decision.match(
          () => IO.succeedNow([state, out, decision]),
          (interval) => {
            const delay = Interval(now, interval.start).size;
            return f(out, delay).map((duration) => {
              const oldStart    = interval.start;
              const newStart    = now + duration;
              const delta       = newStart - oldStart;
              const newEnd      = interval.end + delta;
              const newInterval = Interval(newStart, newEnd);
              return [state, out, Decision.continueWith(newInterval)];
            });
          },
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule onDecision
 */
export function onDecision<S, O, R1>(
  f: (state: S, out: O, decision: Decision) => URIO<R1, any>,
  __tsplusTrace?: string,
) {
  return <R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return Schedule(self.initial, (now, inp, state) =>
      self
        .step(now, inp, state)
        .flatMap(([state, out, decision]) => f(state, out, decision).as([state, out, decision])),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule provideEnvironment
 */
export function provideEnvironment<R>(env: Environment<R>, __tsplusTrace?: string) {
  return <S, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, never, I, O> => {
    return Schedule(self.initial, (now, inp, state) => self.step(now, inp, state).provideEnvironment(env));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule reconsider
 */
export function reconsider<S, O, O2>(
  f: (state: S, out: O, decision: Decision) => Either<O2, readonly [O2, Interval]>,
  __tsplusTrace?: string,
) {
  return <R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O2> => {
    return self.reconsiderIO((state, out, decision) => IO.succeed(f(state, out, decision)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule reconsiderIO
 */
export function reconsiderIO<S, O, R1, O1>(
  f: (state: S, out: O, decision: Decision) => URIO<R1, Either<O1, readonly [O1, Interval]>>,
  __tsplusTrace?: string,
) {
  return <R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O1> => {
    return Schedule(self.initial, (now, inp, state) =>
      self.step(now, inp, state).flatMap(([state, out, decision]) =>
        decision.match(
          () =>
            f(state, out, decision).map((r) =>
              r.match(
                (out1) => [state, out1, Decision.Done],
                ([out1, _]) => [state, out1, Decision.Done],
              ),
            ),
          () =>
            f(state, out, decision).map((r) =>
              r.match(
                (out1) => [state, out1, Decision.Done],
                ([out1, interval]) => [state, out1, Decision.continueWith(interval)],
              ),
            ),
        ),
      ),
    );
  };
}

/**
 * @tsplus static fncts.io.Schedule recurs
 */
export function recurs(n: number, __tsplusTrace?: string): Schedule.WithState<number, never, unknown, number> {
  return Schedule.forever.whileOutput((_) => _ < n);
}

/**
 * @tsplus static fncts.io.Schedule recurWhile
 */
export function recurWhile<A>(f: (a: A) => boolean, __tsplusTrace?: string): Schedule.WithState<void, never, A, A> {
  return identity<A>().whileInput(f);
}

/**
 * @tsplus static fncts.io.Schedule recurWhileIO
 */
export function recurWhileIO<R, A>(
  f: (a: A) => URIO<R, boolean>,
  __tsplusTrace?: string,
): Schedule.WithState<void, R, A, A> {
  return identity<A>().whileInputIO(f);
}

/**
 * @tsplus static fncts.io.Schedule recurWhileEquals
 */
export function recurWhileEquals<A>(value: Lazy<A>, __tsplusTrace?: string): Schedule.WithState<void, never, A, A> {
  return identity<A>().whileInput((a) => Equatable.strictEquals(a, value()));
}

/**
 * @tsplus static fncts.io.Schedule recurUntil
 */
export function recurUntil<A>(f: (a: A) => boolean, __tsplusTrace?: string): Schedule.WithState<void, never, A, A> {
  return identity<A>().untilInput(f);
}

/**
 * @tsplus static fncts.io.Schedule recurUntilIO
 */
export function recurUntilIO<R, A>(
  f: (a: A) => URIO<R, boolean>,
  __tsplusTrace?: string,
): Schedule.WithState<void, R, A, A> {
  return identity<A>().untilInputIO(f);
}

/**
 * @tsplus static fncts.io.Schedule recurUntilEquals
 */
export function recurUntilEquals<A>(value: Lazy<A>, __tsplusTrace?: string): Schedule.WithState<void, never, A, A> {
  return identity<A>().untilInput((a) => Equatable.strictEquals(a, value()));
}

/**
 * @tsplus getter fncts.io.Schedule repetitions
 */
export function repetitions<S, R, I, O>(
  self: Schedule.WithState<S, R, I, O>,
  __tsplusTrace?: string,
): Schedule.WithState<readonly [S, number], R, I, number> {
  return self.fold(0, (n, _) => n + 1);
}

/**
 * @tsplus pipeable fncts.io.Schedule resetAfter
 */
export function resetAfter(duration: number, __tsplusTrace?: string) {
  return <S, R, I, O>(
    self: Schedule.WithState<S, R, I, O>,
  ): Schedule.WithState<readonly [S, Maybe<number>], R, I, O> => {
    return self
      .zip(Schedule.elapsed)
      .resetWhen(([_, d]) => d >= duration)
      .map(([out, _]) => out);
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule resetWhen
 */
export function resetWhen<O>(f: (out: O) => boolean, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> => {
    return Schedule(self.initial, (now, inp, state) =>
      self
        .step(now, inp, state)
        .flatMap(([state, out, decision]) =>
          f(out) ? self.step(now, inp, self.initial) : IO.succeedNow([state, out, decision]),
        ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule run
 */
export function run<I>(now: number, input: Iterable<I>, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): URIO<R, Conc<O>> => {
    const loop = (now: number, xs: List<I>, state: S, acc: Conc<O>): URIO<R, Conc<O>> => {
      if (xs.isEmpty()) {
        return IO.succeedNow(acc);
      } else {
        return self.step(now, xs.head, state).flatMap(([state, out, decision]) =>
          decision.match(
            () => IO.succeed(acc.append(out)),
            (interval) => loop(interval.start, xs.tail, state, acc.append(out)),
          ),
        );
      }
    };
    return loop(now, List.from(input), self.initial, Conc.empty());
  };
}

/**
 * @tsplus static fncts.io.Schedule spaced
 */
export function spaced(duration: number, __tsplusTrace?: string): Schedule.WithState<number, never, unknown, number> {
  return Schedule.forever.addDelay(() => duration);
}

/**
 * @tsplus static fncts.io.Schedule succeed
 */
export function succeed<A>(a: Lazy<A>, __tsplusTrace?: string): Schedule.WithState<number, never, unknown, A> {
  return Schedule.forever.as(a);
}

/**
 * @tsplus pipeable fncts.io.Schedule tapInput
 */
export function tapInput<I, R1>(f: (inp: I) => URIO<R1, any>, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return Schedule(self.initial, (now, inp, state) => f(inp).zipRight(self.step(now, inp, state)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule tapOutput
 */
export function tapOutput<O, R1>(f: (out: O) => URIO<R1, any>, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return Schedule(self.initial, (now, inp, state) => self.step(now, inp, state).tap(([_, out]) => f(out)));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule unionWith
 */
export function unionWith<S1, R1, I1, O1>(
  that: Schedule.WithState<S1, R1, I1, O1>,
  f: (int1: Intervals, int2: Intervals) => Intervals,
  __tsplusTrace?: string,
) {
  return <S, R, I, O>(
    self: Schedule.WithState<S, R, I, O>,
  ): Schedule.WithState<readonly [S, S1], R | R1, I & I1, readonly [O, O1]> => {
    return Schedule([self.initial, that.initial], (now, inp, state) => {
      const left  = self.step(now, inp, state[0]);
      const right = that.step(now, inp, state[1]);
      return left.zipWith(right, ([lstate, l, d1], [rstate, r, d2]) =>
        d1.match(
          () =>
            d2.match(
              () => [[lstate, rstate], [l, r], Decision.Done],
              (interval) => [[lstate, rstate], [l, r], Decision.Continue(interval)],
            ),
          (linterval) =>
            d2.match(
              () => [[lstate, rstate], [l, r], Decision.Continue(linterval)],
              (rinterval) => {
                const combined = f(linterval, rinterval);
                return [[lstate, rstate], [l, r], Decision.Continue(combined)];
              },
            ),
        ),
      );
    });
  };
}

/**
 * @tsplus static fncts.io.ScheduleOps unfold
 */
export function unfold<A>(
  a: Lazy<A>,
  f: (a: A) => A,
  __tsplusTrace?: string,
): Schedule.WithState<A, never, unknown, A> {
  return Schedule<A, never, unknown, A>(a(), (now, inp, state) =>
    IO.succeed([f(state), state, Decision.continueWith(Interval(now, Number.MAX_SAFE_INTEGER))]),
  );
}

/**
 * @tsplus pipeable fncts.io.Schedule untilInput
 */
export function untilInput<I>(f: (inp: I) => boolean, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> => {
    return self.check((inp) => !f(inp));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule untilInputIO
 */
export function untilInputIO<I, R1>(f: (inp: I) => URIO<R1, boolean>, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return self.checkIO((inp) => f(inp).map((b) => !b));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule untilOutput
 */
export function untilOutput<O>(f: (out: O) => boolean, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> => {
    return self.check((_, out) => !f(out));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule untilOutputIO
 */
export function untilOutputIO<O, R1>(f: (out: O) => URIO<R1, boolean>, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return self.checkIO((_, out) => f(out).map((b) => !b));
  };
}

/**
 * @tsplus static fncts.io.Schedule upTo
 */
export function upTo(
  duration: number,
  __tsplusTrace?: string,
): Schedule.WithState<Maybe<number>, never, unknown, number> {
  return Schedule.elapsed.whileOutput((n) => n < duration);
}

/**
 * @tsplus pipeable fncts.io.Schedule whileInput
 */
export function whileInput<I>(f: (inp: I) => boolean, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> => {
    return self.check((inp) => f(inp));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule whileInputIO
 */
export function whileInputIO<I, R1>(f: (inp: I) => URIO<R1, boolean>, __tsplusTrace?: string) {
  return <S, R, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return self.checkIO((inp) => f(inp));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule whileOutput
 */
export function whileOutput<O>(f: (out: O) => boolean, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> => {
    return self.check((_, out) => f(out));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule whileOutputIO
 */
export function whileOutputIO<O, R1>(f: (out: O) => URIO<R1, boolean>, __tsplusTrace?: string) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R | R1, I, O> => {
    return self.checkIO((_, out) => f(out));
  };
}

/**
 * @tsplus static fncts.io.Schedule windowed
 */
export function windowed(
  interval: number,
  __tsplusTrace?: string,
): Schedule.WithState<readonly [Maybe<number>, number], never, unknown, number> {
  return Schedule([Nothing(), 0], (now, inp, [m, n]) =>
    IO.succeed(() =>
      m.match(
        () => [[Just(now), n + 1], n, Decision.continueWith(Interval.after(now + interval))],
        (startMillis) => [
          [Just(startMillis), n + 1],
          n,
          Decision.continueWith(Interval.after(now + (interval - ((now - startMillis) % interval)))),
        ],
      ),
    ),
  );
}

/**
 * @tsplus pipeable fncts.io.Schedule zip
 */
export function zip<S1, R1, I1, O1>(that: Schedule.WithState<S1, R1, I1, O1>, __tsplusTrace?: string) {
  return <S, R, I, O>(
    self: Schedule.WithState<S, R, I, O>,
  ): Schedule.WithState<readonly [S, S1], R | R1, I & I1, readonly [O, O1]> => {
    return self.intersectWith(that, (lInterval, rInterval) => lInterval.intersect(rInterval));
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule zipLeft
 */
export function zipLeft<S1, R1, I1, O1>(that: Schedule.WithState<S1, R1, I1, O1>, __tsplusTrace?: string) {
  return <S, R, I, O>(
    self: Schedule.WithState<S, R, I, O>,
  ): Schedule.WithState<readonly [S, S1], R | R1, I & I1, O> => {
    return self.zip(that).map(([out]) => out);
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule zipRight
 */
export function zipRight<S1, R1, I1, O1>(that: Schedule.WithState<S1, R1, I1, O1>, __tsplusTrace?: string) {
  return <S, R, I, O>(
    self: Schedule.WithState<S, R, I, O>,
  ): Schedule.WithState<readonly [S, S1], R | R1, I & I1, O1> => {
    return self.zip(that).map(([_, out1]) => out1);
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule zipWith
 */
export function zipWith<O, S1, R1, I1, O2, O3>(
  that: Schedule.WithState<S1, R1, I1, O2>,
  f: (out1: O, out2: O2) => O3,
  __tsplusTrace?: string,
) {
  return <S, R, I>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<readonly [S, S1], R | R1, I & I1, O3> => {
    return self.zip(that).map(([out1, out2]) => f(out1, out2));
  };
}
