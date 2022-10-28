import { Emitter, Push } from "./definition.js";

/**
 * @tsplus pipeable fncts.io.Push as
 */
export function as<B>(b: Lazy<B>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R, E, B> => {
    return self.map(b);
  };
}

/**
 * @tsplus pipeable fncts.io.Push flatMap
 */
export function flatMap<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push((emitter) =>
      Do((Δ) => {
        const latch = Δ(CountdownLatch(1));
        Δ(
          self.run(
            Emitter(
              (value) =>
                latch.increment > f(value).run(Emitter(emitter.emit, emitter.failCause, latch.countDown)).forkScoped,
              emitter.failCause,
              latch.countDown,
            ),
          ),
        );
        Δ(latch.await > emitter.end);
      }),
    );
  };
}

/**
 * @tsplus static fncts.io.PushOps fromIO
 */
export function fromIO<R, E, A>(io: IO<R, E, A>): Push<R, E, A> {
  return Push(
    (emitter) =>
      io.matchCauseIO(
        (cause) => emitter.failCause(cause),
        (value) => emitter.emit(value),
      ) > emitter.end,
  );
}

/**
 * @tsplus pipeable fncts.io.Push map
 */
export function map<A, B>(f: (a: A) => B) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, B> => {
    return self.mapIO((a) => IO.succeedNow(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.io.Push mapIO
 */
export function mapIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> =>
    Push((emitter) =>
      self.run(
        Emitter(
          (value) =>
            f(value).matchCauseIO(
              (cause) => emitter.failCause(cause),
              (b) => emitter.emit(b),
            ),
          (cause) => emitter.failCause(cause),
          emitter.end,
        ),
      ),
    );
}

/**
 * @tsplus getter fncts.io.Push runDrain
 */
export function runDrain<R, E, A>(self: Push<R, E, A>): IO<R | Scope, E, void> {
  return Future.make<E, void>().flatMap(
    (future) =>
      self.run(
        Emitter(
          () => IO.unit,
          (cause) => future.failCause(cause),
          future.succeed(undefined),
        ),
      ) > future.await,
  );
}

/**
 * @tsplus static fncts.io.PushOps succeed
 */
export function succeed<A>(value: Lazy<A>): Push<never, never, A> {
  return Push.fromIO(IO.succeed(value));
}

/**
 * @tsplus getter fncts.io.Push multicast
 */
export function multicast<R, E, A>(self: Push<R, E, A>): Push<R, E, A> {
  return new Multicast(self);
}

interface MulticastObserver<E, A> {
  readonly emitter: Emitter<any, E, A>;
  readonly environment: Environment<any>;
  readonly future: Future<never, void>;
}

class Multicast<R, E, A> implements Push<R, E, A>, Emitter<never, E, A> {
  protected observers: Array<MulticastObserver<E, A>> = [];
  protected fiber: Fiber<never, unknown> | undefined;
  constructor(readonly push: Push<R, E, A>) {}

  run<R1>(emitter: Emitter<R1, E, A>): IO<R | R1 | Scope, never, unknown> {
    return Do((Δ) => {
      const environment = Δ(IO.environment<R1>());
      const future      = Δ(Future.make<never, void>());
      Δ(
        IO.defer(() => {
          this.observers.push({ emitter, environment, future });
          if (this.fiber) {
            return IO.unit;
          } else {
            return this.push
              .run(this)
              .schedule(Schedule.asap)
              .forkScoped.tap((fiber) => IO((this.fiber = fiber)));
          }
        }),
      );
      return Δ(future.await);
    });
  }

  emit(value: A) {
    return IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runEvent(value, observer)));
  }

  failCause(cause: Cause<E>) {
    return (
      IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runFailCause(cause, observer))) >
      IO.defer(this.cleanup())
    );
  }

  get end() {
    return (
      IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runEnd(observer))) >
      IO.defer(this.cleanup())
    );
  }

  protected runEvent(value: A, observer: MulticastObserver<E, A>) {
    return observer.emitter
      .emit(value)
      .tapErrorCause((cause) => this.runFailCause(cause, observer))
      .provideEnvironment(observer.environment);
  }

  protected runFailCause(cause: Cause<E>, observer: MulticastObserver<E, A>) {
    this.observers.splice(this.observers.indexOf(observer), 1);
    return observer.emitter.failCause(cause).fulfill(observer.future).provideEnvironment(observer.environment);
  }

  protected runEnd(observer: MulticastObserver<E, A>) {
    this.observers.splice(this.observers.indexOf(observer), 1);
    return observer.emitter.end.fulfill(observer.future).provideEnvironment(observer.environment);
  }

  protected cleanup() {
    if (this.fiber) {
      return this.fiber.interrupt > IO((this.fiber = undefined));
    }
    return IO.unit;
  }
}
