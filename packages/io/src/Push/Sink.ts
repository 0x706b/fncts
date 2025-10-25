import type { Cause } from "@fncts/base/data/Cause";

import { IO } from "@fncts/io/IO";

interface SinkN extends HKT {
  readonly type: Sink<this["I"], this["R"], this["E"], this["A"]>;
  readonly variance: {
    I: "+";
    R: "+";
    E: "-";
    A: "-";
  };
}

/**
 * @tsplus type fncts.io.Push.Sink
 */
export interface Sink<Env, R, E, A> extends Newtype<{ readonly Sink: unique symbol }, URIO<Env, UnsafeSink<R, E, A>>> {}

/**
 * @tsplus type fncts.io.Push.SinkOps
 */
export interface SinkOps extends NewtypeIso<SinkN> {}

export const Sink: SinkOps = Newtype<SinkN>();

/**
 * @tsplus type fncts.io.Push.Sink
 * @tsplus companion fncts.io.Push.SinkOps
 */
export abstract class UnsafeSink<R, in E, in A> {
  abstract onSuccess(value: A): IO<R, never, void>;
  abstract onFailure(cause: Cause<E>): IO<R, never, void>;
}

/**
 * @tsplus static fncts.io.Push.SinkOps unsafeMake
 */
export function unsafeMakeSink<R, E, A>(
  onSuccess: (value: A) => IO<R, never, unknown>,
  onFailure: (cause: Cause<E>) => IO<R, never, unknown>,
): UnsafeSink<R, E, A> {
  return new (class extends UnsafeSink<R, E, A> {
    onSuccess = onSuccess;
    onFailure = onFailure;
  })();
}

/**
 * @tsplus static fncts.io.Push.SinkOps __call
 */
export function makeSink<R, E, A>(
  onSuccess: (value: A) => IO<R, never, unknown>,
  onFailure: (cause: Cause<E>) => IO<R, never, unknown>,
): Sink<never, R, E, A> {
  return Sink.get(IO(Sink.unsafeMake(onSuccess, onFailure)));
}

export class WithEarlyExit<R, E, A> extends UnsafeSink<R, E, A> {
  constructor(
    readonly onSuccess: (value: A) => IO<R, never, void>,
    readonly onFailure: (cause: Cause<E>) => IO<R, never, void>,
    readonly earlyExit: UIO<void>,
  ) {
    super();
  }
}

/**
 * @tsplus static fncts.io.Push.SinkOps withEarlyExit
 */
export function withEarlyExit<R, E, A, R1, B>(
  sink: UnsafeSink<R, E, A>,
  f: (sink: WithEarlyExit<R, E, A>) => IO<R1, E, B>,
): IO<R | R1, never, void> {
  return IO.asyncIO((resume) => {
    const earlyExit = new WithEarlyExit<R, E, A>(
      (value) => sink.onSuccess(value),
      (cause) => sink.onFailure(cause),
      IO(resume(IO.unit)),
    );

    return f(earlyExit).matchCauseIO(
      (cause) => sink.onFailure(cause),
      () => earlyExit.earlyExit,
    );
  });
}

class ProvideSomeEnvironmentSink<R, E, A, R1> extends UnsafeSink<Exclude<R, R1>, E, A> {
  constructor(
    readonly sink: UnsafeSink<R, E, A>,
    readonly environment: Environment<R1>,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E>) {
    return this.sink.onFailure(cause).provideSomeEnvironment(this.environment);
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value).provideSomeEnvironment(this.environment);
  }
}

/**
 * @tsplus pipeable fncts.io.Push.Sink provideSomeEnvironment
 */
export function provideSomeEnvironment<R1>(environment: Environment<R1>) {
  return <Env, R, E, A>(self: Sink<Env, R, E, A>): Sink<Env, Exclude<R, R1>, E, A> => {
    return Sink.get(Sink.reverseGet(self).map((sink) => new ProvideSomeEnvironmentSink(sink, environment)));
  };
}

class MapSink<R, E, A, B> extends UnsafeSink<R, E, A> {
  constructor(
    readonly sink: UnsafeSink<R, E, B>,
    readonly f: (a: A) => B,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E>): IO<R, never, unknown> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(this.f(value));
  }
}

class FilterSink<R, E, A> extends UnsafeSink<R, E, A> {
  constructor(
    readonly sink: UnsafeSink<R, E, A>,
    readonly predicate: Predicate<A>,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E>) {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    if (this.predicate(value)) {
      return this.sink.onSuccess(value);
    } else {
      return IO.unit;
    }
  }
}

class FilterMapSink<R, E, A, B> extends UnsafeSink<R, E, A> {
  constructor(
    readonly sink: UnsafeSink<R, E, B>,
    readonly f: (a: A) => Maybe<B>,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E>) {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return this.f(value).match(
      () => IO.unit,
      (b) => this.sink.onSuccess(b),
    );
  }
}

class MapIOSink<R, E, A, R1, E1, B> extends UnsafeSink<R | R1, E1, B> {
  constructor(
    readonly sink: UnsafeSink<R, E | E1, A>,
    readonly f: (b: B) => IO<R1, E1, A>,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E1>) {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: B) {
    return this.f(value).matchCauseIO(
      (cause) => this.sink.onFailure(cause),
      (a) => this.sink.onSuccess(a),
    );
  }
}

class FilterMapIOSink<R, E, A, R1, E1, B> extends UnsafeSink<R | R1, E1, B> {
  constructor(
    readonly sink: UnsafeSink<R, E | E1, A>,
    readonly f: (b: B) => IO<R1, E1, Maybe<A>>,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E1>) {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: B) {
    return this.f(value).matchCauseIO(
      (cause) => this.sink.onFailure(cause),
      (ma) =>
        ma.match(
          () => IO.unit,
          (a) => this.sink.onSuccess(a),
        ),
    );
  }
}

class FilterIOSink<R, E, A> extends UnsafeSink<R, E, A> {
  constructor(
    readonly sink: UnsafeSink<R, E, A>,
    readonly f: (a: A) => IO<R, E, boolean>,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E>) {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return this.f(value).matchCauseIO(
      (cause) => this.sink.onFailure(cause),
      (b) => {
        if (b) {
          return this.sink.onSuccess(value);
        } else {
          return IO.unit;
        }
      },
    );
  }
}

class TapIOSink<R, E, A, R1, E1> extends UnsafeSink<R | R1, E, A> {
  constructor(
    readonly sink: UnsafeSink<R, E | E1, A>,
    readonly f: (a: A) => IO<R1, E1, unknown>,
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E>) {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return this.f(value).matchCauseIO(
      (cause) => this.sink.onFailure(cause),
      () => this.sink.onSuccess(value),
    );
  }
}

class LoopSink<R, E, A, B, C> extends UnsafeSink<R, E, A> {
  constructor(
    readonly sink: UnsafeSink<R, E, C>,
    private seed: B,
    readonly f: (acc: B, a: A) => readonly [C, B],
  ) {
    super();
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause<E>) {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    const [c, acc] = this.f(this.seed, value);
    this.seed      = acc;
    return this.sink.onSuccess(c);
  }
}

// class LoopCause<R, E, A, B, C> extends UnsafeSink<R, E, A> {}
