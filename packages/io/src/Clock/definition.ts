import { Driver } from "@fncts/io/Schedule/Driver";

/**
 * @tsplus type fncts.io.Clock
 * @tsplus companion fncts.io.ClockOps
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

      const last = ref.get.flatMap(([mOut, _]) =>
        mOut.match(() => IO.failNow(new NoSuchElementError("There is no value left")), IO.succeedNow),
      );

      const reset = ref.set([Nothing(), schedule.initial]);

      const state = ref.get.map(([_, state]) => state);

      return Driver(next, last, reset, state);
    });
  }

  repeat<R, E, A>(io0: Lazy<IO<R, E, A>>) {
    return <R1, B>(schedule0: Lazy<Schedule<R1, A, B>>, __tsplusTrace?: string): IO<R & R1, E, B> =>
      this.repeatOrElse(io0)(schedule0, (e, _) => IO.fail(e));
  }

  repeatOrElse<R, E, A>(io0: Lazy<IO<R, E, A>>) {
    return <R1, B, R2, E2>(
      schedule0: Lazy<Schedule<R1, A, B>>,
      orElse: (e: E, out: Maybe<B>) => IO<R2, E2, B>,
      __tsplusTrace?: string,
    ): IO<R & R1 & R2, E2, B> => this.repeatOrElseEither(io0)(schedule0, orElse).map((_) => _.value);
  }

  repeatOrElseEither<R, E, A>(io0: Lazy<IO<R, E, A>>) {
    return <R1, B, R2, E2, C>(
      schedule0: Lazy<Schedule<R1, A, B>>,
      orElse: (e: E, out: Maybe<B>) => IO<R2, E2, C>,
      __tsplusTrace?: string,
    ): IO<R & R1 & R2, E2, Either<C, B>> =>
      IO.defer(() => {
        const io       = io0();
        const schedule = schedule0();

        return this.driver(schedule).flatMap((driver) => {
          const loop = (a: A): IO<R & R1 & R2, E2, Either<C, B>> =>
            driver.next(a).matchIO(
              () => driver.last.orHalt.map(Either.right),
              (b) =>
                io.matchIO(
                  (e) => orElse(e, Just(b)).map(Either.left),
                  (a) => loop(a),
                ),
            );

          return io.matchIO(
            (e) => orElse(e, Nothing()).map(Either.left),
            (a) => loop(a),
          );
        });
      });
  }

  retry<R, E, A>(io0: Lazy<IO<R, E, A>>) {
    return <R1, O>(schedule0: Lazy<Schedule<R1, E, O>>, __tsplusTrace?: string): IO<R & R1, E, A> =>
      this.retryOrElse(io0)(schedule0, (e) => IO.fail(e));
  }

  retryOrElse<R, E, A>(io0: Lazy<IO<R, E, A>>) {
    return <R1, O, R2, E2>(
      schedule0: Lazy<Schedule<R1, E, O>>,
      orElse: (e: E, out: O) => IO<R2, E2, A>,
      __tsplusTrace?: string,
    ): IO<R & R1 & R2, E2, A> => this.retryOrElseEither(io0)(schedule0, orElse).map((_) => _.value);
  }

  retryOrElseEither<R, E, A>(io0: Lazy<IO<R, E, A>>) {
    return <R1, O, R2, E2, B>(
      schedule0: Lazy<Schedule<R1, E, O>>,
      orElse: (e: E, out: O) => IO<R2, E2, B>,
      __tsplusTrace?: string,
    ): IO<R & R1 & R2, E2, Either<B, A>> =>
      IO.defer(() => {
        const io       = io0();
        const schedule = schedule0();

        const loop = (driver: Schedule.Driver<unknown, R1, E, O>): IO<R & R1 & R2, E2, Either<B, A>> =>
          io.map(Either.right).catchAll((e) =>
            driver.next(e).matchIO(
              () => driver.last.orHalt.flatMap((out) => orElse(e, out).map(Either.left)),
              () => loop(driver),
            ),
          );

        return this.driver(schedule).flatMap(loop);
      });
  }
}

/**
 * @tsplus static fncts.io.ClockOps Tag
 */
export const ClockTag = Tag<Clock>();

/**
 * @tsplus static fncts.io.ClockOps currentTime
 */
export const currentTime = IO.serviceWithIO((clock) => clock.currentTime, Clock.Tag);

/**
 * @tsplus static fncts.io.ClockOps driver
 * @tsplus getter fncts.io.Schedule driver
 */
export function driver<State, Env, In, Out>(
  schedule: Schedule.WithState<State, Env, In, Out>,
): URIO<Has<Clock>, Schedule.Driver<State, Env, In, Out>> {
  return IO.serviceWithIO((clock) => clock.driver(schedule), Clock.Tag);
}

/**
 * @tsplus static fncts.io.ClockOps sleep
 */
export function sleep(duration: number, __tsplusTrace?: string): URIO<Has<Clock>, void> {
  return IO.serviceWithIO((clock) => clock.sleep(duration), Clock.Tag);
}

/**
 * @tsplus static fncts.io.ClockOps repeat
 */
export function repeat<R, E, A>(io0: Lazy<IO<R, E, A>>) {
  return <R1, B>(schedule0: Lazy<Schedule<R1, A, B>>, __tsplusTrace?: string): IO<Has<Clock> & R & R1, E, B> =>
    IO.serviceWithIO((clock) => clock.repeatOrElse(io0)(schedule0, (e, _) => IO.fail(e)), Clock.Tag);
}

/**
 * @tsplus static fncts.io.ClockOps repeatOrElse
 */
export function repeatOrElse<R, E, A>(io0: Lazy<IO<R, E, A>>) {
  return <R1, B, R2, E2>(
    schedule0: Lazy<Schedule<R1, A, B>>,
    orElse: (e: E, out: Maybe<B>) => IO<R2, E2, B>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, B> =>
    IO.serviceWithIO(
      (clock) =>
        clock
          .repeatOrElseEither(io0)(schedule0, orElse)
          .map((_) => _.value),
      Clock.Tag,
    );
}

/**
 * @tsplus static fncts.io.ClockOps repeatOrElseEither
 */
export function repeatOrElseEither<R, E, A>(io0: Lazy<IO<R, E, A>>) {
  return <R1, B, R2, E2, C>(
    schedule0: Lazy<Schedule<R1, A, B>>,
    orElse: (e: E, out: Maybe<B>) => IO<R2, E2, C>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, Either<C, B>> =>
    IO.serviceWithIO((clock) => clock.repeatOrElseEither(io0)(schedule0, orElse), Clock.Tag);
}

/**
 * @tsplus static fncts.io.ClockOps retry
 */
export function retry<R, E, A>(io0: Lazy<IO<R, E, A>>) {
  return <R1, O>(schedule0: Lazy<Schedule<R1, E, O>>, __tsplusTrace?: string): IO<Has<Clock> & R & R1, E, A> =>
    IO.serviceWithIO((clock) => clock.retryOrElse(io0)(schedule0, (e) => IO.fail(e)), Clock.Tag);
}

/**
 * @tsplus static fncts.io.ClockOps retryOrElse
 */
export function retryOrElse<R, E, A>(io0: Lazy<IO<R, E, A>>) {
  return <R1, O, R2, E2>(
    schedule0: Lazy<Schedule<R1, E, O>>,
    orElse: (e: E, out: O) => IO<R2, E2, A>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, A> =>
    IO.serviceWithIO(
      (clock) =>
        clock
          .retryOrElseEither(io0)(schedule0, orElse)
          .map((_) => _.value),
      Clock.Tag,
    );
}

/**
 * @tsplus static fncts.io.ClockOps retryOrElseEither
 */
export function retryOrElseEither<R, E, A>(io0: Lazy<IO<R, E, A>>) {
  return <R1, O, R2, E2, B>(
    schedule0: Lazy<Schedule<R1, E, O>>,
    orElse: (e: E, out: O) => IO<R2, E2, B>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, Either<B, A>> =>
    IO.defer(() => {
      const io       = io0();
      const schedule = schedule0();

      const loop = (driver: Schedule.Driver<unknown, R1, E, O>): IO<R & R1 & R2, E2, Either<B, A>> =>
        io.map(Either.right).catchAll((e) =>
          driver.next(e).matchIO(
            () => driver.last.orHalt.flatMap((out) => orElse(e, out).map(Either.left)),
            () => loop(driver),
          ),
        );

      return IO.serviceWithIO((clock) => clock.driver(schedule).flatMap(loop), Clock.Tag);
    });
}

/**
 * @tsplus static fncts.io.ClockOps schedule
 */
export function schedule<R, E, A, R1, B>(
  io: Lazy<IO<R, E, A>>,
  schedule: Lazy<Schedule<R1, any, B>>,
  __tsplusTrace?: string,
): IO<R & R1 & Has<Clock>, E, B> {
  return Clock.scheduleFrom(io, undefined, schedule);
}

/**
 * @tsplus static fncts.io.ClockOps scheduleFrom
 */
export function scheduleFrom<R, E, A extends A1, R1, A1, B>(
  io0: Lazy<IO<R, E, A>>,
  a: Lazy<A>,
  schedule0: Lazy<Schedule<R1, A1, B>>,
): IO<Has<Clock> & R & R1, E, B> {
  return IO.defer(() => {
    const io       = io0();
    const schedule = schedule0();
    return Clock.driver(schedule).flatMap((driver) => {
      const loop = (a: A1): IO<R & R1, E, B> =>
        driver.next(a).matchIO(
          () => driver.last.orHalt,
          () => io.flatMap(loop),
        );
      return loop(a());
    });
  });
}
