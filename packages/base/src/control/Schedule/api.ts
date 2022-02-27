import type { Lazy } from "../../data/function";
import type { Maybe } from "../../data/Maybe";
import type { UIO, URIO } from "../IO";

import { Conc } from "../../collection/immutable/Conc";
import { List } from "../../collection/immutable/List";
import { Either } from "../../data/Either";
import { Just, Nothing } from "../../data/Maybe";
import { Equatable, wiltSelf } from "../../prelude";
import { IO } from "../IO";
import { Decision, DecisionTag } from "./Decision";
import { Schedule } from "./definition";
import { Interval } from "./Interval";

/**
 * @tsplus static fncts.control.ScheduleOps __call
 */
export function make<State, Env, In, Out>(
  initial: State,
  step: (now: number, inp: In, state: State, __tsplusTrace?: string) => IO<Env, never, readonly [State, Out, Decision]>,
): Schedule.WithState<State, Env, In, Out> {
  return new (class extends Schedule<Env, In, Out> {
    readonly _State!: State;
    initial = initial;
    step = step;
  })();
}

/**
 * @tsplus fluent fncts.control.Schedule addDelay
 */
export function addDelay_<State, Env, In, Out>(
  self: Schedule.WithState<State, Env, In, Out>,
  f: (out: Out) => number,
): Schedule.WithState<State, Env, In, Out> {
  return self.addDelayIO((out) => IO.succeed(f(out)));
}

/**
 * @tsplus fluent fncts.control.Schedule addDelayIO
 */
export function addDelayIO_<State, Env, In, Out, Env1>(
  self: Schedule.WithState<State, Env, In, Out>,
  f: (out: Out) => URIO<Env1, number>,
): Schedule.WithState<State, Env & Env1, In, Out> {
  return self.modifyDelayIO((out, duration) => f(out).map((d) => duration + d));
}

/**
 * @tsplus fluent fncts.control.Schedule andThen
 */
export function andThen<State, Env, In, Out, State1, Env1, In1, Out1>(
  self: Schedule.WithState<State, Env, In, Out>,
  that: Schedule.WithState<State1, Env1, In1, Out1>,
): Schedule.WithState<readonly [State, State1, boolean], Env & Env1, In & In1, Out | Out1> {
  return self.andThenEither(that).map((out) => out.value);
}

/**
 * @tsplus fluent fncts.control.Schedule andThenEither
 */
export function andThenEither_<State, Env, In, Out, State1, Env1, In1, Out1>(
  self: Schedule.WithState<State, Env, In, Out>,
  that: Schedule.WithState<State1, Env1, In1, Out1>,
): Schedule.WithState<readonly [State, State1, boolean], Env & Env1, In & In1, Either<Out, Out1>> {
  return Schedule<readonly [State, State1, boolean], Env & Env1, In & In1, Either<Out, Out1>>(
    [self.initial, that.initial, true],
    (now, inp, [s1, s2, onLeft]) => {
      if (onLeft) {
        return self.step(now, inp, s1).chain(([lState, out, decision]) =>
          decision.match(
            () => that.step(now, inp, s2).map(([rState, out, decision]) => [[lState, rState, false], Either.right(out), decision]),
            (interval) => IO.succeedNow([[lState, s2, true], Either.left(out), Decision.Continue(interval)]),
          ),
        );
      } else {
        return that.step(now, inp, s2).map(([rState, out, decision]) => [[s1, rState, false], Either.right(out), decision]);
      }
    },
  );
}

/**
 * @tsplus fluent fncts.control.Schedule as
 */
export function as_<State, Env, In, Out, Out2>(
  self: Schedule.WithState<State, Env, In, Out>,
  out2: Lazy<Out2>,
): Schedule.WithState<State, Env, In, Out2> {
  return self.map(() => out2());
}

/**
 * @tsplus fluent fncts.control.Schedule check
 */
export function check_<State, Env, In, Out>(
  self: Schedule.WithState<State, Env, In, Out>,
  test: (inp: In, out: Out) => boolean,
): Schedule.WithState<State, Env, In, Out> {
  return self.checkIO((inp, out) => IO.succeed(test(inp, out)));
}

/**
 * @tsplus fluent fncts.control.Schedule checkIO
 */
export function checkIO_<State, Env, In, Out, Env1>(
  self: Schedule.WithState<State, Env, In, Out>,
  test: (inp: In, out: Out) => URIO<Env1, boolean>,
): Schedule.WithState<State, Env & Env1, In, Out> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, out, decision]) =>
      decision.match(
        () => IO.succeedNow([state, out, decision]),
        (interval) => test(inp, out).map((b) => (b ? [state, out, Decision.Continue(interval)] : [state, out, Decision.Done])),
      ),
    ),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule compose_
 */
export function compose_<S, R, I, O, S1, R1, O2>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, O, O2>,
): Schedule.WithState<readonly [S, S1], R & R1, I, O2> {
  return Schedule([self.initial, that.initial], (now, inp, state) =>
    self.step(now, inp, state[0]).chain(([lState, out, decision]) =>
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
}

/**
 * @tsplus fluent fncts.control.Schedule contramap
 */
export function contramap_<S, R, I, O, I2>(self: Schedule.WithState<S, R, I, O>, f: (inp: I2) => I): Schedule.WithState<S, R, I2, O> {
  return self.contramapIO((inp2) => IO.succeed(f(inp2)));
}

/**
 * @tsplus fluent fncts.control.Schedule contramapEnvironment
 */
export function provideSomeEnvironment_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (env: R1) => R,
): Schedule.WithState<S, R1, I, O> {
  return Schedule(self.initial, (now, inp, state) => self.step(now, inp, state).gives(f));
}

/**
 * @tsplus fluent fncts.control.Schedule contramapIO
 */
export function contramapIO_<S, R, I, O, R1, I2>(
  self: Schedule.WithState<S, R, I, O>,
  f: (inp: I2) => URIO<R1, I>,
): Schedule.WithState<S, R & R1, I2, O> {
  return Schedule(self.initial, (now, inp2, state) => f(inp2).chain((inp) => self.step(now, inp, state)));
}

/**
 * @tsplus static fncts.control.ScheduleOps delayed
 */
export function delayed<S, R, I>(schedule: Schedule.WithState<S, R, I, number>): Schedule.WithState<S, R, I, number> {
  return schedule.addDelay((x) => x);
}

/**
 * @tsplus fluent fncts.control.Schedule delayed
 */
export function delayedSelf_<S, R, I, O>(
  self: Schedule.WithState<S, R, I, O>,
  f: (delay: number) => number,
): Schedule.WithState<S, R, I, O> {
  return self.delayedIO((delay) => IO.succeed(f(delay)));
}

/**
 * @tsplus fluent fncts.control.Schedule delayedIO
 */
export function delayedIO_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (delay: number) => URIO<R1, number>,
): Schedule.WithState<S, R & R1, I, O> {
  return self.modifyDelayIO((_, delay) => f(delay));
}

/**
 * @tsplus getter fncts.control.Schedule delays
 */
export function delays<S, R, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, number> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, _, decision]) =>
      decision.match(
        () => IO.succeedNow([state, 0, Decision.Done]),
        (interval) => {
          const delay = interval.startMilliseconds - now;
          return IO.succeedNow([state, delay, Decision.Continue(interval)]);
        },
      ),
    ),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule dimap
 */
export function dimap_<S, R, I, O, I2, O2>(
  self: Schedule.WithState<S, R, I, O>,
  f: (inp2: I2) => I,
  g: (out: O) => O2,
): Schedule.WithState<S, R, I2, O2> {
  return self.contramap(f).map(g);
}

/**
 * @tsplus fluent fncts.control.Schedule dimapIO
 */
export function dimapIO_<S, R, I, O, R1, I2, R2, O2>(
  self: Schedule.WithState<S, R, I, O>,
  f: (inp2: I2) => URIO<R1, I>,
  g: (out: O) => URIO<R2, O2>,
): Schedule.WithState<S, R & R1 & R2, I2, O2> {
  return self.contramapIO(f).mapIO(g);
}

/**
 * @tsplus static fncts.control.ScheduleOps duration
 */
export function duration(duration: number): Schedule.WithState<boolean, unknown, unknown, number> {
  return Schedule<boolean, unknown, unknown, number>(true, (now, _, state) =>
    IO.succeed(() => {
      if (state) {
        const interval = Interval.after(now + duration);
        return [false, duration, Decision.Continue(interval)];
      } else {
        return [false, 0, Decision.Done];
      }
    }),
  );
}

/**
 * @tsplus static fncts.control.ScheduleOps elapsed
 */
export const elapsed: Schedule.WithState<Maybe<number>, unknown, unknown, number> = Schedule(Nothing(), (now, _, state) =>
  IO.succeed(
    state.match(
      () => [Just(now), 0, Decision.Continue(Interval(now, Number.MAX_SAFE_INTEGER))],
      (start) => {
        const duration = now - start;
        return [Just(start), duration, Decision.Continue(Interval(now, Number.MAX_SAFE_INTEGER))];
      },
    ),
  ),
);

/**
 * @tsplus fluent fncts.control.Schedule ensuring
 */
export function ensuring_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, finalizer: UIO<any>): Schedule.WithState<S, R, I, O> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, out, decision]) =>
      decision.match(
        () => finalizer.as([state, out, Decision.Done]),
        (interval) => IO.succeedNow([state, out, Decision.Continue(interval)]),
      ),
    ),
  );
}

/**
 * @tsplus static fncts.control.ScheduleOps exponential
 */
export function exponential(base: number, factor = 2): Schedule.WithState<number, unknown, unknown, number> {
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
 * @tsplus static fncts.control.ScheduleOps fixed
 */
export function fixed(interval: number): Schedule.WithState<readonly [Maybe<readonly [number, number]>, number], unknown, unknown, number> {
  return Schedule([Nothing(), 0], (now, inp, [ms, n]) =>
    IO.succeed(
      ms.match(
        () => {
          const nextRun = now + interval;
          return [[Just([now, nextRun]), n + 1], n, Decision.Continue(Interval.after(nextRun))];
        },
        ([startMillis, lastRun]) => {
          const runningBehind = now > lastRun + interval;
          const boundary      = interval === 0 ? interval : interval - ((now - startMillis) % interval);
          const sleepTime     = boundary === 0 ? interval : boundary;
          const nextRun       = runningBehind ? now : now + sleepTime;
          return [[Just([startMillis, nextRun]), n + 1], n, Decision.Continue(Interval.after(nextRun))];
        },
      ),
    ),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule fold
 */
export function fold_<S, R, I, O, Z>(
  self: Schedule.WithState<S, R, I, O>,
  z: Z,
  f: (z: Z, out: O) => Z,
): Schedule.WithState<readonly [S, Z], R, I, Z> {
  return self.foldIO(z, (z, out) => IO.succeed(f(z, out)));
}

/**
 * @tsplus fluent fncts.control.Schedule foldIO
 */
export function foldIO_<S, R, I, O, Z, R1>(
  self: Schedule.WithState<S, R, I, O>,
  z: Z,
  f: (z: Z, out: O) => URIO<R1, Z>,
): Schedule.WithState<readonly [S, Z], R & R1, I, Z> {
  return Schedule([self.initial, z], (now, inp, [s, z]) =>
    self.step(now, inp, s).chain(([s, out, decision]) =>
      decision.match(
        () => IO.succeedNow([[s, z], z, Decision.Done]),
        (interval) => f(z, out).map((z2) => [[s, z2], z, Decision.Continue(interval)]),
      ),
    ),
  );
}

/**
 * @tsplus getter fncts.control.Schedule forever
 */
export function foreverSelf<S, R, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<S, R, I, O> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, out, decision]) =>
      decision.match(
        () => self.step(now, inp, self.initial),
        (interval) => IO.succeed([state, out, Decision.Continue(interval)]),
      ),
    ),
  );
}

/**
 * @tsplus static fncts.control.ScheduleOps forever
 */
export const forever = Schedule.unfold(0, (n) => n + 1);

/**
 * @tsplus static fncts.control.ScheduleOps identity
 */
export function identity<A>(): Schedule.WithState<void, unknown, A, A> {
  return Schedule(undefined, (now, inp, state) => IO.succeed([state, inp, Decision.Continue(Interval.after(now))]));
}

function intersectWithLoop<S, R, I, O, S1, R1, I1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O1>,
  inp: I & I1,
  lState: S,
  out: O,
  lInterval: Interval,
  rState: S1,
  out2: O1,
  rInterval: Interval,
  f: (lInterval: Interval, rInterval: Interval) => Interval,
): IO<R & R1, never, readonly [readonly [S, S1], readonly [O, O1], Decision]> {
  const combined = f(lInterval, rInterval);
  if (combined.isNonEmpty) {
    return IO.succeedNow([[lState, rState], [out, out2], Decision.Continue(combined)]);
  } else if (lInterval < rInterval) {
    return self.step(lInterval.endMilliseconds, inp, lState).chain(([lState, out, decision]) =>
      decision.match(
        () => IO.succeedNow([[lState, rState], [out, out2], Decision.Done]),
        (lInterval) => intersectWithLoop(self, that, inp, lState, out, lInterval, rState, out2, rInterval, f),
      ),
    );
  } else {
    return that.step(rInterval.endMilliseconds, inp, rState).chain(([rState, out2, decision]) =>
      decision.match(
        () => IO.succeedNow([[lState, rState], [out, out2], Decision.Done]),
        (rInterval) => intersectWithLoop(self, that, inp, lState, out, lInterval, rState, out2, rInterval, f),
      ),
    );
  }
}

/**
 * @tsplus fluent fncts.control.Schedule intersectWith
 */
export function intersectWith_<S, R, I, O, S1, R1, I1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O1>,
  f: (int1: Interval, int2: Interval) => Interval,
): Schedule.WithState<readonly [S, S1], R & R1, I & I1, readonly [O, O1]> {
  return Schedule([self.initial, that.initial] as const, (now, inp, state) => {
    const left  = self.step(now, inp, state[0]);
    const right = that.step(now, inp, state[1]);

    return left.zipWith(right, ([lState, out, lDecision], [rState, out2, rDecision]) => {
      if (lDecision._tag === DecisionTag.Continue && rDecision._tag === DecisionTag.Continue) {
        return intersectWithLoop(self, that, inp, lState, out, lDecision.interval, rState, out2, rDecision.interval, f);
      } else {
        return IO.succeedNow([[lState, rState], [out, out2], Decision.Done] as const);
      }
    }).flatten;
  });
}

/**
 * @tsplus static fncts.control.Schedule linear
 */
export function linear(base: number): Schedule.WithState<number, unknown, unknown, number> {
  return Schedule.delayed(Schedule.forever.map((i) => base * (i + 1)));
}

/**
 * @tsplus fluent fncts.control.Schedule map
 */
export function map_<State, Env, In, Out, Out1>(
  self: Schedule.WithState<State, Env, In, Out>,
  f: (out: Out) => Out1,
): Schedule.WithState<State, Env, In, Out1> {
  return self.mapIO((out) => IO.succeedNow(f(out)));
}

/**
 * @tsplus fluent fncts.control.Schedule mapIO
 */
export function mapIO_<State, Env, In, Out, Env1, Out1>(
  self: Schedule.WithState<State, Env, In, Out>,
  f: (out: Out) => URIO<Env1, Out1>,
): Schedule.WithState<State, Env & Env1, In, Out1> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, out, decision]) => f(out).map((out1) => [state, out1, decision])),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule modifyDelayIO
 */
export function modifyDelayIO_<State, Env, In, Out, Env1>(
  self: Schedule.WithState<State, Env, In, Out>,
  f: (out: Out, duration: number) => URIO<Env1, number>,
): Schedule.WithState<State, Env & Env1, In, Out> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, out, decision]) =>
      decision.match(
        () => IO.succeedNow([state, out, decision]),
        (interval) => {
          const delay = Interval(now, interval.startMilliseconds).size;

          return f(out, delay).map((duration) => {
            const oldStart    = interval.startMilliseconds;
            const newStart    = now + duration;
            const delta       = newStart - oldStart;
            const newEnd      = interval.endMilliseconds + delta;
            const newInterval = Interval(newStart, newEnd);
            return [state, out, Decision.Continue(newInterval)];
          });
        },
      ),
    ),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule onDecision
 */
export function onDecision_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (state: S, out: O, decision: Decision) => URIO<R1, any>,
): Schedule.WithState<S, R & R1, I, O> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, out, decision]) => f(state, out, decision).as([state, out, decision])),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule provideEnvironment
 */
export function provideEnvironment_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, env: R): Schedule.WithState<S, unknown, I, O> {
  return Schedule(self.initial, (now, inp, state) => self.step(now, inp, state).give(env));
}

/**
 * @tsplus fluent fncts.control.Schedule reconsider
 */
export function reconsider_<S, R, I, O, O2>(
  self: Schedule.WithState<S, R, I, O>,
  f: (state: S, out: O, decision: Decision) => Either<O2, readonly [O2, Interval]>,
): Schedule.WithState<S, R, I, O2> {
  return self.reconsiderIO((state, out, decision) => IO.succeed(f(state, out, decision)));
}

/**
 * @tsplus fluent fncts.control.Schedule reconsiderIO
 */
export function reconsiderIO_<S, R, I, O, R1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (state: S, out: O, decision: Decision) => URIO<R1, Either<O1, readonly [O1, Interval]>>,
): Schedule.WithState<S, R & R1, I, O1> {
  return Schedule(self.initial, (now, inp, state) =>
    self.step(now, inp, state).chain(([state, out, decision]) =>
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
              ([out1, interval]) => [state, out1, Decision.Continue(interval)],
            ),
          ),
      ),
    ),
  );
}

/**
 * @tsplus static fncts.control.Schedule recurs
 */
export function recurs(n: number): Schedule.WithState<number, unknown, unknown, number> {
  return Schedule.forever.whileOutput((_) => _ < n);
}

/**
 * @tsplus static fncts.control.Schedule recurWhile
 */
export function recurWhile<A>(f: (a: A) => boolean): Schedule.WithState<void, unknown, A, A> {
  return identity<A>().whileInput(f);
}

/**
 * @tsplus static fncts.control.Schedule recurWhileIO
 */
export function recurWhileIO<R, A>(f: (a: A) => URIO<R, boolean>): Schedule.WithState<void, R, A, A> {
  return identity<A>().whileInputIO(f);
}

/**
 * @tsplus static fncts.control.Schedule recurWhileEquals
 */
export function recurWhileEquals<A>(value: Lazy<A>): Schedule.WithState<void, unknown, A, A> {
  return identity<A>().whileInput((a) => Equatable.strictEquals(a, value()));
}

/**
 * @tsplus static fncts.control.Schedule recurUntil
 */
export function recurUntil<A>(f: (a: A) => boolean): Schedule.WithState<void, unknown, A, A> {
  return identity<A>().untilInput(f);
}

/**
 * @tsplus static fncts.control.Schedule recurUntilIO
 */
export function recurUntilIO<R, A>(f: (a: A) => URIO<R, boolean>): Schedule.WithState<void, R, A, A> {
  return identity<A>().untilInputIO(f);
}

/**
 * @tsplus static fncts.control.Schedule recurUntilEquals
 */
export function recurUntilEquals<A>(value: Lazy<A>): Schedule.WithState<void, unknown, A, A> {
  return identity<A>().untilInput((a) => Equatable.strictEquals(a, value()));
}

/**
 * @tsplus getter fncts.control.Schedule repetitions
 */
export function repetitions<S, R, I, O>(self: Schedule.WithState<S, R, I, O>): Schedule.WithState<readonly [S, number], R, I, number> {
  return self.fold(0, (n, _) => n + 1);
}

/**
 * @tsplus fluent fncts.control.Schedule resetAfter
 */
export function resetAfter_<S, R, I, O>(
  self: Schedule.WithState<S, R, I, O>,
  duration: number,
): Schedule.WithState<readonly [S, Maybe<number>], R, I, O> {
  return self
    .zip(Schedule.elapsed)
    .resetWhen(([_, d]) => d >= duration)
    .map(([out, _]) => out);
}

/**
 * @tsplus fluent fncts.control.Schedule resetWhen
 */
export function resetWhen_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, f: (out: O) => boolean): Schedule.WithState<S, R, I, O> {
  return Schedule(self.initial, (now, inp, state) =>
    self
      .step(now, inp, state)
      .chain(([state, out, decision]) => (f(out) ? self.step(now, inp, self.initial) : IO.succeedNow([state, out, decision]))),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule run
 */
export function run_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, now: number, input: Iterable<I>): URIO<R, Conc<O>> {
  const loop = (now: number, xs: List<I>, state: S, acc: Conc<O>): URIO<R, Conc<O>> => {
    if (xs.isEmpty()) {
      return IO.succeedNow(acc);
    } else {
      return self.step(now, xs.head, state).chain(([state, out, decision]) =>
        decision.match(
          () => IO.succeed(acc.append(out)),
          (interval) => loop(interval.startMilliseconds, xs.tail, state, acc.append(out)),
        ),
      );
    }
  };
  return loop(now, List.from(input), self.initial, Conc.empty());
}

/**
 * @tsplus static fncts.control.Schedule spaced
 */
export function spaced(duration: number): Schedule.WithState<number, unknown, unknown, number> {
  return Schedule.forever.addDelay(() => duration);
}

/**
 * @tsplus static fncts.control.Schedule succeed
 */
export function succeed<A>(a: Lazy<A>): Schedule.WithState<number, unknown, unknown, A> {
  return Schedule.forever.as(a);
}

/**
 * @tsplus fluent fncts.control.Schedule tapInput
 */
export function tapInput_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (inp: I) => URIO<R1, any>,
): Schedule.WithState<S, R & R1, I, O> {
  return Schedule(self.initial, (now, inp, state) => f(inp).apSecond(self.step(now, inp, state)));
}

/**
 * @tsplus fluent fncts.control.Schedule tapOutput
 */
export function tapOutput_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (out: O) => URIO<R1, any>,
): Schedule.WithState<S, R & R1, I, O> {
  return Schedule(self.initial, (now, inp, state) => self.step(now, inp, state).tap(([_, out]) => f(out)));
}

/**
 * @tsplus fluent fncts.control.Schedule unionWith
 */
export function unionWith_<S, R, I, O, S1, R1, I1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O1>,
  f: (int1: Interval, int2: Interval) => Interval,
): Schedule.WithState<readonly [S, S1], R & R1, I & I1, readonly [O, O1]> {
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
}

/**
 * @tsplus static fncts.control.ScheduleOps unfold
 */
export function unfold<A>(a: Lazy<A>, f: (a: A) => A): Schedule.WithState<A, unknown, unknown, A> {
  return Schedule<A, unknown, unknown, A>(a(), (now, inp, state) =>
    IO.succeed([f(state), state, Decision.Continue(Interval(now, Number.MAX_SAFE_INTEGER))]),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule untilInput
 */
export function untilInput_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, f: (inp: I) => boolean): Schedule.WithState<S, R, I, O> {
  return self.check((inp) => !f(inp));
}

/**
 * @tsplus fluent fncts.control.Schedule untilInputIO
 */
export function untilInputIO_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (inp: I) => URIO<R1, boolean>,
): Schedule.WithState<S, R & R1, I, O> {
  return self.checkIO((inp) => f(inp).map((b) => !b));
}

/**
 * @tsplus fluent fncts.control.Schedule untilOutput
 */
export function untilOutput_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, f: (out: O) => boolean): Schedule.WithState<S, R, I, O> {
  return self.check((_, out) => !f(out));
}

/**
 * @tsplus fluent fncts.control.Schedule untilOutputIO
 */
export function untilOutputIO_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (out: O) => URIO<R1, boolean>,
): Schedule.WithState<S, R & R1, I, O> {
  return self.checkIO((_, out) => f(out).map((b) => !b));
}

/**
 * @tsplus static fncts.control.Schedule upTo
 */
export function upTo(duration: number): Schedule.WithState<Maybe<number>, unknown, unknown, number> {
  return Schedule.elapsed.whileOutput((n) => n < duration);
}

/**
 * @tsplus fluent fncts.control.Schedule whileInput
 */
export function whileInput_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, f: (inp: I) => boolean): Schedule.WithState<S, R, I, O> {
  return self.check((inp) => f(inp));
}

/**
 * @tsplus fluent fncts.control.Schedule whileInputIO
 */
export function whileInputIO_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (inp: I) => URIO<R1, boolean>,
): Schedule.WithState<S, R & R1, I, O> {
  return self.checkIO((inp) => f(inp));
}

/**
 * @tsplus fluent fncts.control.Schedule whileOutput
 */
export function whileOutput_<S, R, I, O>(self: Schedule.WithState<S, R, I, O>, f: (out: O) => boolean): Schedule.WithState<S, R, I, O> {
  return self.check((_, out) => f(out));
}

/**
 * @tsplus fluent fncts.control.Schedule whileOutputIO
 */
export function whileOutputIO_<S, R, I, O, R1>(
  self: Schedule.WithState<S, R, I, O>,
  f: (out: O) => URIO<R1, boolean>,
): Schedule.WithState<S, R & R1, I, O> {
  return self.checkIO((_, out) => f(out));
}

/**
 * @tsplus static fncts.control.Schedule windowed
 */
export function windowed(interval: number): Schedule.WithState<readonly [Maybe<number>, number], unknown, unknown, number> {
  return Schedule([Nothing(), 0], (now, inp, [m, n]) =>
    IO.succeed(() =>
      m.match(
        () => [[Just(now), n + 1], n, Decision.Continue(Interval.after(now + interval))],
        (startMillis) => [
          [Just(startMillis), n + 1],
          n,
          Decision.Continue(Interval.after(now + (interval - ((now - startMillis) % interval)))),
        ],
      ),
    ),
  );
}

/**
 * @tsplus fluent fncts.control.Schedule zip
 */
export function zip_<S, R, I, O, S1, R1, I1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O1>,
): Schedule.WithState<readonly [S, S1], R & R1, I & I1, readonly [O, O1]> {
  return self.intersectWith(that, (lInterval, rInterval) => lInterval.intersect(rInterval));
}

/**
 * @tsplus fluent fncts.control.Schedule zipLeft
 */
export function zipLeft_<S, R, I, O, S1, R1, I1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O1>,
): Schedule.WithState<readonly [S, S1], R & R1, I & I1, O> {
  return self.zip(that).map(([out]) => out);
}

/**
 * @tsplus fluent fncts.control.Schedule zipRight
 */
export function zipRight_<S, R, I, O, S1, R1, I1, O1>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O1>,
): Schedule.WithState<readonly [S, S1], R & R1, I & I1, O1> {
  return self.zip(that).map(([_, out1]) => out1);
}

/**
 * @tsplus fluent fncts.control.Schedule zipWith
 */
export function zipWith_<S, R, I, O, S1, R1, I1, O2, O3>(
  self: Schedule.WithState<S, R, I, O>,
  that: Schedule.WithState<S1, R1, I1, O2>,
  f: (out1: O, out2: O2) => O3,
): Schedule.WithState<readonly [S, S1], R & R1, I & I1, O3> {
  return self.zip(that).map(([out1, out2]) => f(out1, out2));
}
