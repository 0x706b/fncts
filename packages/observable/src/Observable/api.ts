import { popNumber } from "@fncts/observable/internal/args";
import { arrayOrObject, arrayRemove, readableStreamToAsyncGenerator } from "@fncts/observable/internal/util";
import { Notification } from "@fncts/observable/Notification";
import { EMPTY, EnvironmentWith, Observable } from "@fncts/observable/Observable/definition";
import { caughtSchedule } from "@fncts/observable/Scheduler";

export interface Subscribable<E, A> {
  subscribe(observer: Partial<Observer<E, A>>): Unsubscribable;
}

export type ObservableInput<R = never, E = never, A = never> =
  | Observable<R, E, A>
  | Subscribable<E, A>
  | AsyncIterable<A>
  | PromiseLike<A>
  | ArrayLike<A>
  | Iterable<A>
  | ReadableStreamLike<A>
  | IO<R, E, A>;

/**
 * @tsplus static fncts.observable.ObservableOps halt
 */
export function halt(defect: unknown): Observable<never, never, never> {
  return new Observable((s) => s.error(Cause.halt(defect)));
}

/**
 * @tsplus static fncts.observable.ObservableOps defer
 */
export function defer<R, E, A>(observable: Lazy<ObservableInput<R, E, A>>): Observable<R, E, A> {
  return new Observable((s, environment) => {
    from(observable()).provideEnvironment(environment).subscribe(s);
  });
}

/**
 * @tsplus static fncts.observable.ObservableOps empty
 */
export function empty<A>(): Observable<never, never, A> {
  return EMPTY;
}

/**
 * @tsplus static fncts.observable.ObservableOps environmentWithObservable
 */
export function environmentWithObservable<R0, R, E, A>(
  f: (environment: Environment<R0>) => Observable<R, E, A>,
): Observable<R0 | R, E, A> {
  return new EnvironmentWith(f);
}

/**
 * @tsplus static fncts.observable.ObservableOps failCause
 */
export function failCause<E>(cause: Cause<E>): Observable<never, E, never> {
  return new Observable((s) => s.error(cause));
}

/**
 * @tsplus static fncts.observable.ObservableOps fail
 */
export function fail<E>(e: E): Observable<never, E, never> {
  return new Observable((s) => s.error(Cause.fail(e)));
}

/**
 * @tsplus static fncts.observable.ObservableOps from
 */
export function from<R = never, E = never, A = never>(input: ObservableInput<R, E, A>): Observable<R, E, A> {
  if (input instanceof Observable) {
    return input;
  }
  if (isArrayLike(input)) {
    return fromArrayLike(input);
  }
  if (isPromiseLike(input)) {
    return fromPromise(input);
  }
  if (isAsyncIterable(input)) {
    return fromAsyncIterable(input);
  }
  if (isIterable(input)) {
    return fromIterable(input);
  }
  if (isReadableStream(input)) {
    return fromReadableStreamLike(input);
  }
  if (isIO(input)) {
    return fromIO(input);
  }
  if ("subscribe" in input) {
    return fromSubscribable(input);
  }
  throw new TypeError("Invalid Observable input");
}

export function fromArrayLike<A>(input: ArrayLike<A>): Observable<never, never, A> {
  return new Observable((s) => {
    for (let i = 0; i < input.length && !s.closed; i++) {
      s.next(input[i]!);
    }
    s.complete();
  });
}

export function fromAsyncIterable<A>(asyncIterable: AsyncIterable<A>): Observable<never, never, A> {
  return new Observable((s) => {
    process(asyncIterable, s).catch((err) => s.error(Cause.halt(err)));
  });
}

export function fromIterable<A>(iterable: Iterable<A>): Observable<never, never, A> {
  return new Observable((s) => {
    for (const value of iterable) {
      s.next(value);
      if (s.closed) {
        return;
      }
    }
    s.complete();
  });
}

export function fromPromise<A>(promise: PromiseLike<A>): Observable<never, never, A> {
  return new Observable((s) => {
    promise
      .then(
        (value) => {
          if (!s.closed) {
            s.next(value);
            s.complete();
          }
        },
        (err) => s.error(Cause.halt(err)),
      )
      .then(null, reportUnhandledError);
  });
}

export function fromReadableStreamLike<A>(readableStream: ReadableStreamLike<A>): Observable<never, never, A> {
  return fromAsyncIterable(readableStreamToAsyncGenerator(readableStream));
}

/**
 * @tsplus static fncts.observable.ObservableOps fromSubscribable
 */
export function fromSubscribable<E, A>(subscribable: Subscribable<E, A>): Observable<never, E, A> {
  return new Observable((subscriber) => subscribable.subscribe(subscriber));
}

export function fromInterop<A>(subscribable: {
  subscribe: (observer: {
    next: (value: A) => void;
    error: (err: unknown) => void;
    complete: () => void;
  }) => Unsubscribable;
}): Observable<never, unknown, A> {
  return new Observable((subscriber) =>
    subscribable.subscribe({
      next: (value) => subscriber.next(value),
      error: (err) => subscriber.error(Cause.halt(err)),
      complete: () => subscriber.complete(),
    }),
  );
}

function _if<R, E, A, R1, E1, B>(
  condition: () => boolean,
  onTrue: ObservableInput<R, E, A>,
  onFalse: ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, A | B> {
  return defer<R | R1, E | E1, A | B>(() => (condition() ? onTrue : onFalse));
}

export { _if as if };

export interface IterateOptions<S> {
  readonly initialState: S;
  readonly cont?: (state: S) => boolean;
  readonly iterate: (state: S) => S;
  readonly scheduler?: SchedulerLike;
}

export function iterate<S>(options: IterateOptions<S>): Observable<never, never, S> {
  const { initialState, cont, iterate, scheduler } = options;

  function* gen() {
    for (let state = initialState; !cont || cont(state); state = iterate(state)) {
      yield state;
    }
  }

  return defer(scheduler ? () => scheduleIterable(gen(), scheduler!) : gen);
}

async function process<A>(asyncIterable: AsyncIterable<A>, subscriber: Subscriber<never, A>) {
  for await (const value of asyncIterable) {
    subscriber.next(value);
    if (subscriber.closed) {
      return;
    }
  }
  subscriber.complete();
}

/**
 * @tsplus static fncts.obervable.ObservableOps interval
 */
export function interval(period = 0, scheduler: SchedulerLike = asyncScheduler): Observable<never, never, number> {
  if (period < 0) {
    // eslint-disable-next-line no-param-reassign
    period = 0;
  }

  return timer(period, period, scheduler);
}

/**
 * @tsplus static fncts.obervable.ObservableOps merge
 */
export function merge<O extends ReadonlyArray<ObservableInput<any, any>>>(
  ...sources: O
): Observable<Observable.EnvironmentOf<O[number]>, Observable.ErrorOf<O[number]>, Observable.TypeOf<O[number]>>;
export function merge<O extends ReadonlyArray<ObservableInput<any, any>>>(
  ...sources: [...O, number?]
): Observable<Observable.EnvironmentOf<O[number]>, Observable.ErrorOf<O[number]>, Observable.TypeOf<O[number]>>;
export function merge<O extends ReadonlyArray<ObservableInput<any, any>>>(
  ...sources: [...O, number?]
): Observable<Observable.EnvironmentOf<O[number]>, Observable.ErrorOf<O[number]>, Observable.TypeOf<O[number]>> {
  const concurrency = popNumber(sources, Infinity);
  return !sources.length
    ? empty()
    : sources.length === 1
    ? from(sources[0] as ObservableInput<any, any>)
    : mergeAll_(fromArrayLike(sources as ReadonlyArray<ObservableInput<any, any>>), concurrency);
}

/**
 * @tsplus static fncts.observable.ObservableOps of
 */
export function of<A>(...items: ReadonlyArray<A>): Observable<never, never, A> {
  return fromArrayLike(items);
}

/**
 * @tsplus static fncts.observable.ObservableOps single
 */
export function single<A>(a: A): Observable<never, never, A> {
  return new Observable((s) => {
    s.next(a);
    s.complete();
  });
}

/**
 * @tsplus fluent fncts.observable.Observable scheduled
 * @tsplus static fncts.observable.ObservableOps scheduled
 */
export function scheduled<R, E, A>(input: ObservableInput<R, E, A>, scheduler: SchedulerLike): Observable<R, E, A> {
  if (isArrayLike(input)) {
    return scheduleArray(input, scheduler);
  }
  if (isPromiseLike(input)) {
    return schedulePromise(input, scheduler);
  }
  if (isIterable(input)) {
    return scheduleIterable(input, scheduler);
  }
  if (isAsyncIterable(input)) {
    return scheduleAsyncIterable(input, scheduler);
  }
  if (isReadableStream(input)) {
    return scheduleReadableStreamLike(input, scheduler);
  }
  return scheduleObservable(from(input), scheduler);
}

export function scheduleArray<A>(input: ArrayLike<A>, scheduler: SchedulerLike): Observable<never, never, A> {
  return new Observable<never, never, A>((s) => {
    let i = 0;
    return scheduler.schedule(function () {
      if (i === input.length) {
        s.complete();
      } else {
        s.next(input[i++]!);
        if (!s.closed) {
          this.schedule();
        }
      }
    });
  });
}

export function scheduleAsyncIterable<A>(
  input: AsyncIterable<A>,
  scheduler: SchedulerLike,
): Observable<never, never, A> {
  return new Observable((subscriber) => {
    const sub = new Subscription();
    sub.add(
      scheduler.schedule(() => {
        const iterator = input[Symbol.asyncIterator]();
        sub.add(
          scheduler.schedule(function () {
            iterator.next().then((result) => {
              if (result.done) {
                subscriber.complete();
              } else {
                subscriber.next(result.value);
                this.schedule();
              }
            });
          }),
        );
      }),
    );
    return sub;
  });
}

export function scheduleIterable<A>(input: Iterable<A>, scheduler: SchedulerLike): Observable<never, never, A> {
  return new Observable((s) => {
    let iterator: Iterator<A, A>;
    s.add(
      scheduler.schedule(() => {
        iterator = input[Symbol.iterator]();
        caughtSchedule(s, scheduler, function () {
          const { value, done } = iterator.next();
          if (done) {
            s.complete();
          } else {
            s.next(value);
            this.schedule();
          }
        });
      }),
    );

    return () => isFunction(iterator?.return) && iterator.return();
  });
}

export function scheduleObservable<R, E, A>(input: Observable<R, E, A>, scheduler: SchedulerLike): Observable<R, E, A> {
  return new Observable((subscriber, environment) => {
    const sub = new Subscription();
    sub.add(
      scheduler.schedule(() => {
        sub.add(
          input.provideEnvironment(environment).subscribe({
            next: (value) => {
              sub.add(scheduler.schedule(() => subscriber.next(value)));
            },
            error: (err) => {
              sub.add(scheduler.schedule(() => subscriber.error(err)));
            },
            complete: () => {
              sub.add(scheduler.schedule(() => subscriber.complete()));
            },
          }),
        );
      }),
    );
  });
}

export function schedulePromise<A>(input: PromiseLike<A>, scheduler: SchedulerLike): Observable<never, never, A> {
  return new Observable((subscriber) => {
    return scheduler.schedule(() => {
      input.then(
        (value) => {
          subscriber.add(
            scheduler.schedule(() => {
              subscriber.next(value);
              subscriber.add(scheduler.schedule(() => subscriber.complete()));
            }),
          );
        },
        (err) => {
          subscriber.add(scheduler.schedule(() => subscriber.error(Cause.halt(err))));
        },
      );
    });
  });
}

export function scheduleReadableStreamLike<A>(
  input: ReadableStreamLike<A>,
  scheduler: SchedulerLike,
): Observable<never, never, A> {
  return scheduleAsyncIterable(readableStreamToAsyncGenerator(input), scheduler);
}

/**
 * @tsplus static fncts.observable.ObservableOps timer
 */
export function timer(
  time: number | Date,
  interval?: number,
  scheduler?: SchedulerLike,
): Observable<never, never, number>;
export function timer(time: number | Date, scheduler?: SchedulerLike): Observable<never, never, number>;
export function timer(
  time: number | Date = 0,
  intervalOrScheduler?: number | SchedulerLike,
  scheduler: SchedulerLike = asyncScheduler,
): Observable<never, never, number> {
  let intervalDuration = -1;
  if (intervalOrScheduler != null) {
    if (isScheduler(intervalOrScheduler)) {
      // eslint-disable-next-line no-param-reassign
      scheduler = intervalOrScheduler;
    } else {
      intervalDuration = intervalOrScheduler as number;
    }
  }
  return new Observable((s) => {
    let due = isValidDate(time) ? +time - scheduler.now() : time;
    if (due < 0) {
      due = 0;
    }
    let n = 0;
    return scheduler.schedule(function () {
      if (!s.closed) {
        s.next(n++);
        if (0 <= intervalDuration) {
          this.schedule(undefined, intervalDuration);
        } else {
          s.complete();
        }
      }
    }, due);
  });
}

/**
 * @tsplus static fncts.observable.ObservableOps zip
 */
export function makeZip<O extends ReadonlyArray<ObservableInput<any, any>>>(
  ...sources: O
): Observable<
  Observable.EnvironmentOf<O[number]>,
  Observable.ErrorOf<O[number]>,
  { [K in keyof O]: Observable.TypeOf<O[K]> }
> {
  return sources.length
    ? new Observable((subscriber, environment) => {
        let buffers: unknown[][] = sources.map(() => []);
        let completed            = sources.map(() => false);
        subscriber.add(() => {
          buffers = completed = null!;
        });
        for (let sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
          from(sources[sourceIndex]!)
            .provideEnvironment(environment)
            .subscribe(
              operatorSubscriber(subscriber, {
                next: (value) => {
                  buffers[sourceIndex]!.push(value);
                  if (buffers.every((buffer) => buffer.length)) {
                    const result: any = buffers.map((buffer) => buffer.shift()!);
                    subscriber.next(result);
                    if (buffers.some((buffer, i) => !buffer.length && completed[i])) {
                      subscriber.complete();
                    }
                  }
                },
                complete: () => {
                  completed[sourceIndex] = true;
                  !buffers[sourceIndex]!.length && subscriber.complete();
                },
              }),
            );
        }
        return () => {
          buffers = completed = null!;
        };
      })
    : empty();
}

/**
 * @tsplus static fncts.observable.ObservableOps fromIO
 */
export function fromIO<R, E, A>(io: IO<R, E, A>, scheduler: SchedulerLike = asyncScheduler): Observable<R, E, A> {
  return new Observable((s, env) => {
    let fiber: FiberContext<E, A>;
    const scheduled = scheduler.schedule(() => {
      fiber = io.provideEnvironment(env).unsafeRunFiber();
      fiber.unsafeOnDone((exit) => {
        if (!s.closed) {
          exit.flatten.match(
            (cause) => s.error(cause),
            (a) => s.next(a),
          );
          s.complete();
        }
      });
    });
    return () => {
      scheduled.unsubscribe();
      fiber && fiber.interrupt.unsafeRunAsync();
    };
  });
}

/**
 * @tsplus static fncts.observable.ObservableOps unit
 */
export const unit: Observable<never, never, void> = Observable.single(undefined);

/**
 * @tsplus fluent fncts.observable.Observable zipWith
 */
export function zipWith<R, E, A, R1, E1, B, C>(
  fa: Observable<R, E, A>,
  fb: Observable<R1, E1, B>,
  f: (a: A, b: B) => C,
): Observable<R | R1, E | E1, C> {
  return fa.mergeMap((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus fluent fncts.observable.Observable zip
 */
export function zip<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  fb: Observable<R1, E1, B>,
): Observable<R | R1, E | E1, readonly [A, B]> {
  return zipWith(fa, fb, Function.tuple);
}

/**
 * @tsplus fluent fncts.observable.Observable ap
 */
export function ap<R, E, A, R1, E1, B>(
  fab: Observable<R, E, (a: A) => B>,
  fa: Observable<R1, E1, A>,
): Observable<R | R1, E | E1, B> {
  return zipWith(fab, fa, (f, a) => f(a));
}

/**
 * @tsplus fluent fncts.observable.Observable mapWithIndex
 */
export function mapWithIndex<R, E, A, B>(fa: Observable<R, E, A>, f: (i: number, a: A) => B): Observable<R, E, B> {
  return fa.operate((source, subscriber, environment) => {
    let i = 0;
    source.provideEnvironment(environment).subscribe(
      new OperatorSubscriber(subscriber, {
        next: (value) => {
          subscriber.next(f(i++, value));
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable map
 */
export function map_<R, E, A, B>(fa: Observable<R, E, A>, f: (a: A) => B): Observable<R, E, B> {
  return fa.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.observable.Observable as
 */
export function as_<R, E, A, B>(fa: Observable<R, E, A>, b: Lazy<B>): Observable<R, E, B> {
  return map_(fa, b);
}

/**
 * @tsplus fluent fncts.observable.Observable mapError
 */
export function mapError_<R, E, A, E1>(fa: Observable<R, E, A>, f: (e: E) => E1): Observable<R, E1, A> {
  return fa.operate((source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(
      new OperatorSubscriber(subscriber, {
        error: (err) => {
          subscriber.error(err.map(f));
        },
      }),
    );
  });
}

/**
 * @tsplus getter fncts.observable.Observable swap
 */
export function swap<R, E, A>(fa: Observable<R, E, A>): Observable<R, A, E> {
  return operate_(fa, (source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(
      new OperatorSubscriber(subscriber, {
        next: (value) => {
          subscriber.error(Cause.fail(value));
        },
        error: (err) => {
          err.failureOrCause.match(
            (e) => {
              subscriber.next(e);
            },
            (cause) => {
              subscriber.error(cause);
            },
          );
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable filterWithIndex
 */
export function filterWithIndex_<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: RefinementWithIndex<number, A, B>,
): Observable<R, E, B>;
export function filterWithIndex_<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, A>;
export function filterWithIndex_<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, A> {
  return operate_(fa, (source, subscriber, environment) => {
    let index = 0;
    source
      .provideEnvironment(environment)
      .subscribe(
        operatorSubscriber(subscriber, { next: (value) => predicate(index++, value) && subscriber.next(value) }),
      );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable filter
 */
export function filter_<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: Refinement<A, B>,
): Observable<R, E, B>;
export function filter_<R, E, A>(fa: Observable<R, E, A>, predicate: Predicate<A>): Observable<R, E, A>;
export function filter_<R, E, A>(fa: Observable<R, E, A>, predicate: Predicate<A>): Observable<R, E, A> {
  return fa.filterWithIndex((_, a) => predicate(a));
}

/**
 * @tsplus fluent fncts.observable.Observable filterMapWithIndex
 */
export function filterMapWithIndex<R, E, A, B>(
  fa: Observable<R, E, A>,
  f: (i: number, a: A) => Maybe<B>,
): Observable<R, E, B> {
  return operate_(fa, (source, subscriber, environment) => {
    let index = 0;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) =>
          f(index++, value).match(
            () => noop,
            (b) => subscriber.next(b),
          ),
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable filterMap
 */
export function filterMap_<R, E, A, B>(fa: Observable<R, E, A>, f: (a: A) => Maybe<B>): Observable<R, E, B> {
  return fa.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.observable.Observable partitionWithIndex
 */
export function partitionWithIndex<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: RefinementWithIndex<number, A, B>,
): readonly [Observable<R, E, Exclude<A, B>>, Observable<R, E, B>];
export function partitionWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): readonly [Observable<R, E, A>, Observable<R, E, A>];
export function partitionWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): readonly [Observable<R, E, A>, Observable<R, E, A>] {
  return [fa.filterWithIndex((i, a) => !predicate(i, a)), fa.filterWithIndex(predicate)];
}

/**
 * @tsplus fluent fncts.observable.Observable partition
 */
export function partition_<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: Refinement<A, B>,
): readonly [Observable<R, E, Exclude<A, B>>, Observable<R, E, B>];
export function partition_<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: Predicate<A>,
): readonly [Observable<R, E, A>, Observable<R, E, A>];
export function partition_<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: Predicate<A>,
): readonly [Observable<R, E, A>, Observable<R, E, A>] {
  return fa.partitionWithIndex((_, a) => predicate(a));
}

/**
 * @tsplus fluent fncts.observable.Observable partitionMapWithIndex
 */
export function partitionMapWithIndex_<R, E, A, B, C>(
  fa: Observable<R, E, A>,
  f: (i: number, a: A) => Either<B, C>,
): readonly [Observable<R, E, B>, Observable<R, E, C>] {
  return [
    operate_(fa, (source, subscriber, environment) => {
      let index = 0;
      source.provideEnvironment(environment).subscribe(
        operatorSubscriber(subscriber, {
          next: (value) => {
            f(index++, value).match((b) => subscriber.next(b), noop);
          },
        }),
      );
    }),
    operate_(fa, (source, subscriber, environment) => {
      let index = 0;
      source.provideEnvironment(environment).subscribe(
        operatorSubscriber(subscriber, {
          next: (value) => {
            f(index++, value).match(noop, (c) => subscriber.next(c));
          },
        }),
      );
    }),
  ];
}

/**
 * @tsplus fluent fncts.observable.Observable partitionMap
 */
export function partitionMap_<R, E, A, B, C>(
  fa: Observable<R, E, A>,
  f: (a: A) => Either<B, C>,
): readonly [Observable<R, E, B>, Observable<R, E, C>] {
  return fa.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.observable.Observable provideService
 */
export function provideService<R, E, A, S>(
  self: Observable<R, E, A>,
  service: S,
  /** @tsplus auto */ tag: Tag<S>,
): Observable<Exclude<R, S>, E, A> {
  return self.contramapEnvironment((environment) => environment.add(service, tag) as Environment<R>);
}

/**
 * @tsplus fluent fncts.observable.Observable mergeMapWithIndex
 */
export function mergeMapWithIndex<R, E, A, R1, E1, B>(
  ma: Observable<R, E, A>,
  f: (i: number, a: A) => ObservableInput<R1, E1, B>,
  concurrent = Infinity,
): Observable<R | R1, E | E1, B> {
  return operate_(ma, (source, sub, environment) => mergeInternal(source, sub, environment, f, concurrent));
}

/**
 * @tsplus fluent fncts.observable.Observable mergeMap
 */
export function mergeMap_<R, E, A, R1, E1, B>(
  ma: Observable<R, E, A>,
  f: (a: A) => ObservableInput<R1, E1, B>,
  concurrent = Infinity,
): Observable<R | R1, E | E1, B> {
  return ma.mergeMapWithIndex((_, a) => f(a), concurrent);
}

/**
 * @tsplus fluent fncts.observable.Observable concatMapWithIndex
 */
export function concatMapWithIndex<R, E, A, R1, E1, B>(
  ma: Observable<R, E, A>,
  f: (i: number, a: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return ma.mergeMapWithIndex(f, 1);
}

/**
 * @tsplus fluent fncts.observable.Observable concatMap
 */
export function concatMap_<R, E, A, R1, E1, B>(
  ma: Observable<R, E, A>,
  f: (a: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return ma.mergeMapWithIndex((_, a) => f(a), 1);
}

/**
 * @tsplus fluent fncts.observable.Observable contramapEnvironment
 */
export function contramapEnvironment<R, E, A, R0>(
  self: Observable<R, E, A>,
  f: (r0: Environment<R0>) => Environment<R>,
): Observable<R0, E, A> {
  return Observable.environmentWithObservable((environment) => self.provideEnvironment(f(environment)));
}

/**
 * @tsplus getter fncts.observable.Observable flatten
 */
export function flatten<R, E, R1, E1, A>(mma: Observable<R, E, Observable<R1, E1, A>>): Observable<R | R1, E | E1, A> {
  return mma.concatAll;
}

/**
 * @tsplus fluent fncts.observable.Observable foldLeftWithIndex
 */
export function foldLeftWithIndex<R, E, A, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (index: number, acc: B, value: A) => B,
): Observable<R, E, B> {
  return fa.operate(scanInternal(f, initial, true, false, true));
}

/**
 * @tsplus fluent fncts.observable.Observable foldLeft
 */
export function foldLeft<R, E, A, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (acc: B, value: A) => B,
): Observable<R, E, B> {
  return fa.foldLeftWithIndex(initial, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.observable.Observable at
 */
export function at_<R, E, A>(fa: Observable<R, E, A>, index: number): Observable<R, E, Maybe<A>> {
  return fa
    .filterWithIndex((i) => i === index)
    .take(1)
    .map(Maybe.just)
    .onEmpty(() => Nothing());
}

/**
 * @tsplus fluent fncts.observable.Observable audit
 */
export function audit_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  durationSelector: (value: A) => ObservableInput<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    let lastValue: Maybe<A> = Nothing();
    let durationSubscriber: Subscriber<any, any> | null = null;
    let isComplete    = false;
    const endDuration = () => {
      durationSubscriber?.unsubscribe();
      durationSubscriber = null;
      if (lastValue.isJust()) {
        const { value } = lastValue;
        lastValue       = Nothing();
        subscriber.next(value);
      }
      isComplete && subscriber.complete();
    };

    const cleanupDuration = () => {
      durationSubscriber = null;
      isComplete && subscriber.complete();
    };

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          lastValue = Just(value);
          if (!durationSubscriber) {
            from(durationSelector(value))
              .provideEnvironment(environment)
              .subscribe(
                (durationSubscriber = operatorSubscriber(subscriber, { next: endDuration, complete: cleanupDuration })),
              );
          }
        },
        complete: () => {
          isComplete = true;
          (lastValue.isNothing() || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable auditTime
 */
export function auditTime_<R, E, A>(
  fa: Observable<R, E, A>,
  duration: number,
  scheduler: SchedulerLike = asyncScheduler,
): Observable<R, E, A> {
  return fa.audit(() => timer(duration, scheduler));
}

/**
 * @tsplus fluent fncts.observable.Observable buffer
 */
export function buffer_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  closingNotifier: Observable<R1, E1, any>,
): Observable<R | R1, E | E1, ReadonlyArray<A>> {
  return fa.operate((source, subscriber, environment) => {
    let buffer: A[] = [];
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => buffer.push(value),
        complete: () => {
          subscriber.next(buffer);
          subscriber.complete();
        },
      }),
    );
    closingNotifier.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: () => {
          const b = buffer;
          buffer  = [];
          subscriber.next(b);
        },
        complete: noop,
      }),
    );
    return () => {
      buffer = null!;
    };
  });
}

/**
 * @tsplus fluent fncts.observable.Observable bufferCount
 */
export function bufferCount_<R, E, A>(
  fa: Observable<R, E, A>,
  bufferSize: number,
  startBufferEvery?: number,
): Observable<R, E, ReadonlyArray<A>> {
  // eslint-disable-next-line no-param-reassign
  startBufferEvery = startBufferEvery ?? bufferSize;
  return fa.operate((source, subscriber, environment) => {
    let buffers: A[][] = [];
    let count          = 0;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => {
            let toEmit: A[][] | null = null;
            if (count++ % startBufferEvery! === 0) {
              buffers.push([]);
            }
            for (const buffer of buffers) {
              buffer.push(value);
              if (bufferSize <= buffer.length) {
                toEmit = toEmit ?? [];
                toEmit.push(buffer);
              }
            }
            if (toEmit) {
              for (const buffer of toEmit) {
                arrayRemove(buffers, buffer);
                subscriber.next(buffer);
              }
            }
          },
          complete: () => {
            for (const buffer of buffers) {
              subscriber.next(buffer);
            }
            subscriber.complete();
          },
        },
        () => {
          buffers = null!;
        },
      ),
    );
  });
}

export interface BufferTimeConfig {
  readonly bufferTimeSpan: number;
  readonly bufferCreationInterval?: number;
  readonly maxBufferSize?: number;
  readonly scheduler?: SchedulerLike;
}

/**
 * @tsplus fluent fncts.observable.Observable bufferTime
 */
export function bufferTime_<R, E, A>(
  fa: Observable<R, E, A>,
  config: BufferTimeConfig,
): Observable<R, E, ReadonlyArray<A>> {
  const {
    bufferTimeSpan,
    bufferCreationInterval = null,
    maxBufferSize = Infinity,
    scheduler = asyncScheduler,
  } = config;
  return fa.operate((source, subscriber, environment) => {
    let bufferRecords: { buffer: A[]; subs: Subscription }[] | null = [];
    let restartOnEmit = true;
    const emit        = (record: { buffer: A[]; subs: Subscription }) => {
      const { buffer, subs } = record;
      subs.unsubscribe();
      arrayRemove(bufferRecords, record);
      subscriber.next(buffer);
      restartOnEmit && startBuffer();
    };
    const startBuffer = () => {
      if (bufferRecords) {
        const subs = new Subscription();
        subscriber.add(subs);
        const buffer: A[] = [];
        const record      = {
          buffer,
          subs,
        };
        bufferRecords.push(record);
        subs.add(scheduler.schedule(() => emit(record), bufferTimeSpan));
      }
    };
    bufferCreationInterval !== null && bufferCreationInterval >= 0
      ? subscriber.add(
          scheduler.schedule(function () {
            startBuffer();
            !this.closed && subscriber.add(this.schedule(null, bufferCreationInterval));
          }, bufferCreationInterval),
        )
      : (restartOnEmit = true);
    startBuffer();
    const bufferTimeSubscriber = operatorSubscriber(
      subscriber,
      {
        next: (value: A) => {
          const recordsCopy = bufferRecords!.slice();
          for (const record of recordsCopy) {
            const { buffer } = record;
            buffer.push(value);
            maxBufferSize <= buffer.length && emit(record);
          }
        },
        complete: () => {
          while (bufferRecords?.length) {
            subscriber.next(bufferRecords.shift()!.buffer);
          }
          bufferTimeSubscriber?.unsubscribe();
          subscriber.complete();
          subscriber.unsubscribe();
        },
      },
      () => (bufferRecords = null),
    );
    source.provideEnvironment(environment).subscribe(bufferTimeSubscriber);
  });
}

/**
 * @tsplus fluent fncts.observable.Observable bufferToggle
 */
export function bufferToggle_<R, E, A, R1, E1, B, R2, E2>(
  fa: Observable<R, E, A>,
  openings: ObservableInput<R1, E1, B>,
  closingSelector: (value: B) => ObservableInput<R2, E2, any>,
): Observable<R | R1 | R2, E | E1 | E2, ReadonlyArray<A>> {
  return fa.operate((source, subscriber, environment) => {
    const buffers: A[][] = [];
    from(openings)
      .provideEnvironment(environment)
      .subscribe(
        operatorSubscriber(subscriber, {
          next: (openValue) => {
            const buffer: A[] = [];
            buffers.push(buffer);
            const closingSubscription = new Subscription();
            const emitBuffer          = () => {
              arrayRemove(buffers, buffer);
              subscriber.next(buffer);
              closingSubscription.unsubscribe();
            };
            closingSubscription.add(
              from(closingSelector(openValue))
                .provideEnvironment(environment)
                .subscribe(operatorSubscriber(subscriber, { next: emitBuffer, complete: noop })),
            );
          },
          complete: noop,
        }),
      );
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          for (const buffer of buffers) {
            buffer.push(value);
          }
        },
        complete: () => {
          while (buffers.length > 0) {
            subscriber.next(buffers.shift()!);
          }
          subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable bufferWhen
 */
export function bufferWhen_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  closingSelector: () => ObservableInput<R1, E1, any>,
): Observable<R | R1, E | E1, ReadonlyArray<A>> {
  return fa.operate((source, subscriber, environment) => {
    let buffer: A[] | null = null;
    let closingSubscriber: Subscriber<E | E1, A> | null = null;
    const openBuffer = () => {
      closingSubscriber?.unsubscribe();
      const b = buffer;
      buffer  = [];
      b && subscriber.next(b);
      from(closingSelector())
        .provideEnvironment(environment)
        .subscribe((closingSubscriber = operatorSubscriber(subscriber, { next: openBuffer, complete: noop })));
    };
    openBuffer();
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => buffer?.push(value),
          complete: () => {
            buffer && subscriber.next(buffer);
            subscriber.complete();
          },
        },
        () => (buffer = closingSubscriber = null),
      ),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable catchAllCause
 */
export function catchAllCause<R, E, A, R1, E1, B>(
  self: Observable<R, E, A>,
  f: (cause: Cause<E>, caught: Observable<R | R1, E | E1, A | B>) => ObservableInput<R | R1, E1, B>,
): Observable<R | R1, E1, A | B> {
  return self.operate((source, subscriber, environment) => {
    let innerSub: Subscription | null = null;
    let syncUnsub                     = false;
    let handledResult: Observable<R | R1, E1, B>;
    innerSub                          = source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        error: (cause) => {
          handledResult = from(f(cause, source.catchAllCause(f)));
          if (innerSub) {
            innerSub.unsubscribe();
            innerSub = null;
            handledResult.provideEnvironment(environment).subscribe(subscriber);
          } else {
            syncUnsub = true;
          }
        },
      }),
    );
    if (syncUnsub) {
      innerSub.unsubscribe();
      innerSub = null;
      handledResult!.provideEnvironment(environment).subscribe(subscriber);
    }
  });
}

/**
 * @tsplus getter fncts.observable.Observable concatAll
 */
export function concatAll<R, E, R1, E1, A>(
  ffa: Observable<R, E, ObservableInput<R1, E1, A>>,
): Observable<R | R1, E | E1, A> {
  return mergeAll_(ffa, 1);
}

/**
 * @tsplus fluent fncts.observable.Observable concat
 */
export function concat_<R, E, A, O extends ReadonlyArray<ObservableInput<any, any>>>(
  fa: Observable<R, E, A>,
  ...sources: O
): Observable<
  R | Observable.EnvironmentOf<O[number]>,
  E | Observable.ErrorOf<O[number]>,
  A | Observable.TypeOf<O[number]>
> {
  return fa.operate((source, subscriber, environment) => {
    fromArrayLike([source, ...sources])
      .concatAll.provideEnvironment(environment)
      .subscribe(subscriber);
  });
}

/**
 * @tsplus getter fncts.observable.Observable count
 */
export function count<R, E, A>(fa: Observable<R, E, A>): Observable<R, E, number> {
  return fa.foldLeft(0, (total, _) => total + 1);
}

/**
 * @tsplus fluent fncts.observable.Observable countWithIndex
 */
export function countWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, number> {
  return fa.foldLeftWithIndex(0, (i, total, v) => (predicate(i, v) ? total + 1 : total));
}

/**
 * @tsplus fluent fncts.observable.Observable countWith
 */
export function countWith_<R, E, A>(fa: Observable<R, E, A>, predicate: Predicate<A>): Observable<R, E, number> {
  return fa.countWithIndex((_, a) => predicate(a));
}

/**
 * @tsplus getter fncts.observable.Observable combineLatestAll
 */
export function combineLatestAll<R, E, R1, E1, A>(
  fa: Observable<R, E, ObservableInput<R1, E1, A>>,
): Observable<R | R1, E | E1, ReadonlyArray<A>> {
  return joinAllInternal(fa, (sources) =>
    !sources.length ? empty() : (zipLatest(sources[0]!, ...sources.slice(1)) as any),
  );
}

/**
 * @tsplus fluent fncts.observable.Observable zipLatest
 */
export function zipLatest<R, E, A, O extends ReadonlyArray<ObservableInput<any, any, any>>>(
  self: ObservableInput<R, E, A>,
  ...sources: O
): Observable<
  R | Observable.EnvironmentOf<O[number]>,
  E | Observable.ErrorOf<O[number]>,
  [A, ...{ [K in keyof O]: Observable.TypeOf<O[K]> }]
> {
  if (!sources.length) {
    return from(self).unsafeCoerce();
  }
  return from(self).operate((source, subscriber, environment) => {
    combineLatestInternal(subscriber, environment, [source, ...sources]);
  });
}

/**
 * @tsplus fluent fncts.observable.Observable zipWithLatest
 */
export function zipWithLatest<R, E, A, R1, E1, B, C>(
  self: Observable<R, E, A>,
  that: ObservableInput<R1, E1, B>,
  f: (a: A, b: B) => C,
): Observable<R | R1, E | E1, C> {
  return self.zipLatest(Observable.from(that)).map(f.tupled);
}

/**
 * @tsplus fluent fncts.observable.Observable debounceWith
 */
export function debounceWith_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  durationSelector: (value: A) => ObservableInput<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    let lastValue: Maybe<A> = Nothing();
    let durationSubscriber: Subscriber<E1, any> | null = null;
    const emit = () => {
      durationSubscriber?.unsubscribe();
      durationSubscriber = null;
      if (lastValue.isJust()) {
        const { value } = lastValue;
        lastValue       = Nothing();
        subscriber.next(value);
      }
    };
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => {
            durationSubscriber?.unsubscribe();
            lastValue          = Just(value);
            durationSubscriber = operatorSubscriber(subscriber, { next: emit, complete: noop });
            from(durationSelector(value)).provideEnvironment(environment).subscribe(durationSubscriber);
          },
          complete: () => {
            emit();
            subscriber.complete();
          },
        },
        () => {
          lastValue = durationSubscriber = null!;
        },
      ),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable debounce
 */
export function debounce_<R, E, A>(
  fa: Observable<R, E, A>,
  dueTime: number,
  scheduler: SchedulerLike = asyncScheduler,
): Observable<R, E, A> {
  return fa.operate((source, subscriber, environment) => {
    let activeTask: Subscription | null = null;
    let lastValue: A | null             = null;
    let lastTime: number | null         = null;

    const emit = () => {
      if (activeTask) {
        activeTask.unsubscribe();
        activeTask  = null;
        const value = lastValue!;
        lastValue   = null;
        subscriber.next(value);
      }
    };
    function emitWhenIdle(this: SchedulerAction<unknown>) {
      const targetTime = lastTime! + dueTime;
      const now        = scheduler.now();
      if (now < targetTime) {
        activeTask = this.schedule(undefined, targetTime - now);
        subscriber.add(activeTask);
        return;
      }
      emit();
    }
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => {
            lastValue = value;
            lastTime  = scheduler.now();
            if (!activeTask) {
              activeTask = scheduler.schedule(emitWhenIdle, dueTime);
              subscriber.add(activeTask);
            }
          },
          complete: () => {
            emit();
            subscriber.complete();
          },
        },
        () => {
          lastValue = activeTask = null;
        },
      ),
    );
  });
}

/**
 * @tsplus getter fncts.observable.Observable either
 */
export function either<R, E, A>(fa: Observable<R, E, A>): Observable<R, never, Either<E, A>> {
  return fa.operate((source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          subscriber.next(Either.right(value));
        },
        error: (error) => {
          error.failureOrCause.match(
            (e) => subscriber.next(Either.left(e)),
            (cause) => subscriber.error(cause),
          );
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable delayWithIndex
 */
export function delayWithIndex<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  f: (index: number, value: A) => Observable<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.mergeMapWithIndex((i, a) => f(i, a).take(1).as(a));
}

/**
 * @tsplus fluent fncts.observable.Observable delayWith
 */
export function delayWith_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  f: (value: A) => Observable<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.delayWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.observable.Observable delay
 */
export function delay_<R, E, A>(
  fa: Observable<R, E, A>,
  due: number | Date,
  scheduler: SchedulerLike = asyncScheduler,
): Observable<R, E, A> {
  const duration = timer(due, scheduler);
  return delayWith_(fa, () => duration);
}

/**
 * @tsplus getter fncts.observable.Observable dematerialize
 */
export function dematerialize<R, E, E1, A>(fa: Observable<R, E, Notification<E1, A>>): Observable<R, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    source
      .provideEnvironment(environment)
      .subscribe(operatorSubscriber(subscriber, { next: (notification) => notification.observe(subscriber) }));
  });
}

/**
 * @tsplus fluent fncts.observable.Observable ensuring
 */
export function ensuring_<R, E, A>(fa: Observable<R, E, A>, finalizer: () => void): Observable<R, E, A> {
  return fa.operate((source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(subscriber);
    subscriber.add(finalizer);
  });
}

/**
 * @tsplus getter fncts.observable.Observable exhaustAll
 */
export function exhaustAll<R, E, R1, E1, A>(
  ffa: Observable<R, E, ObservableInput<R1, E1, A>>,
): Observable<R | R1, E | E1, A> {
  return ffa.operate((source, subscriber, environment) => {
    let isComplete                    = false;
    let innerSub: Subscription | null = null;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (inner) => {
          if (!innerSub) {
            innerSub = from(inner)
              .provideEnvironment(environment)
              .subscribe(
                operatorSubscriber(subscriber, {
                  complete: () => {
                    innerSub = null;
                    isComplete && subscriber.complete();
                  },
                }),
              );
          }
        },
        complete: () => {
          isComplete = true;
          !innerSub && subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable exhaustMapWithIndex
 */
export function exhaustMapWithIndex<R, E, A, R1, E1, B>(
  self: Observable<R, E, A>,
  f: (i: number, a: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return self.operate((source, subscriber, environment) => {
    let index = 0;
    let innerSub: Subscriber<E1, B> | null = null;
    let isComplete = false;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (outerValue) => {
          if (!innerSub) {
            innerSub = operatorSubscriber(subscriber, {
              complete: () => {
                innerSub = null;
                isComplete && subscriber.complete();
              },
            });
            from(f(index++, outerValue))
              .provideEnvironment(environment)
              .subscribe(innerSub);
          }
        },
        complete: () => {
          isComplete = true;
          !innerSub && subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable exhaustMap
 */
export function exhaustMap_<R, E, A, R1, E1, B>(
  self: Observable<R, E, A>,
  f: (a: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return self.exhaustMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.observable.Observable expandWithIndex
 */
export function expandWithIndex<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  f: (i: number, a: A) => ObservableInput<R1, E1, B>,
  concurrent = Infinity,
): Observable<R | R1, E | E1, B> {
  // eslint-disable-next-line no-param-reassign
  concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
  return fa.operate((source, subscriber, environment) =>
    mergeInternal(source, subscriber, environment, f, concurrent, undefined, true),
  );
}

/**
 * @tsplus fluent fncts.observable.Observable expand
 */
export function expand_<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  f: (a: A) => ObservableInput<R1, E1, B>,
  concurrent = Infinity,
): Observable<R | R1, E | E1, B> {
  return fa.expandWithIndex((_, a) => f(a), concurrent);
}

/**
 * @tsplus fluent fncts.observable.Observable findWithIndex
 */
export function findWithIndex<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: RefinementWithIndex<number, A, B>,
): Observable<R, E, Maybe<B>>;
export function findWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, Maybe<A>>;
export function findWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, Maybe<A>> {
  return fa.operate(findInternal(predicate, "value"));
}

/**
 * @tsplus fluent fncts.observable.Observable find
 */
export function find_<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: Refinement<A, B>,
): Observable<R, E, Maybe<B>>;
export function find_<R, E, A>(fa: Observable<R, E, A>, predicate: Predicate<A>): Observable<R, E, Maybe<A>>;
export function find_<R, E, A>(fa: Observable<R, E, A>, predicate: Predicate<A>): Observable<R, E, Maybe<A>> {
  return fa.findWithIndex((_, a) => predicate(a));
}

/**
 * @tsplus fluent fncts.observable.Observable findIndexWithIndex
 */
export function findIndexWithIndex<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: RefinementWithIndex<number, A, B>,
): Observable<R, E, number>;
export function findIndexWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, number>;
export function findIndexWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, number> {
  return fa.operate(findInternal(predicate, "index"));
}

/**
 * @tsplus fluent fncts.observable.Observable findIndex
 */
export function findIndex_<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: Refinement<A, B>,
): Observable<R, E, number>;
export function findIndex_<R, E, A>(fa: Observable<R, E, A>, predicate: Predicate<A>): Observable<R, E, number>;
export function findIndex_<R, E, A>(fa: Observable<R, E, A>, predicate: Predicate<A>): Observable<R, E, number> {
  return findIndexWithIndex(fa, (_, a) => predicate(a));
}

/**
 * @tsplus static fncts.observable.ObservableOps forkJoin
 */
export function forkJoin<S extends Record<string, ObservableInput<any, any>>>(
  sources: S,
): Observable<
  Observable.EnvironmentOf<S[keyof S]>,
  Observable.ErrorOf<S[keyof S]>,
  { [K in keyof S]: Observable.TypeOf<S[K]> }
>;
export function forkJoin<A extends ReadonlyArray<ObservableInput<any, any>>>(
  ...sources: A
): Observable<
  Observable.EnvironmentOf<A[number]>,
  Observable.ErrorOf<A[number]>,
  { [K in keyof A]: Observable.TypeOf<A[K]> }
>;
export function forkJoin(...args: any[]): Observable<any, any, any> {
  const { args: sources, keys } = arrayOrObject(args);
  return new Observable((s) => {
    const length = sources.length;
    if (!length) {
      s.complete();
      return;
    }
    const values             = new Array(length);
    let remainingCompletions = length;
    let remainingEmissions   = length;
    for (let sourceIndex = 0; sourceIndex < length; sourceIndex++) {
      let hasValue = false;
      from(sources[sourceIndex]).subscribe(
        operatorSubscriber(s, {
          next: (value: any) => {
            if (!hasValue) {
              hasValue = true;
              remainingEmissions--;
            }
            values[sourceIndex] = value;
          },
          complete: () => {
            if (!--remainingCompletions || !hasValue) {
              if (!remainingEmissions) {
                s.next(
                  keys
                    ? keys.reduce((b, k, i) => {
                        b[k] = values[i];
                        return b;
                      }, {})
                    : values,
                );
              }
              s.complete();
            }
          },
        }),
      );
    }
  });
}

/**
 * @tsplus getter fncts.observable.Observable ignore
 */
export function ignore<R, E, A>(fa: Observable<R, E, A>): Observable<R, E, never> {
  return fa.operate((source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: noop,
      }),
    );
  });
}

/**
 * @tsplus getter fncts.observable.Observable isEmpty
 */
export function isEmpty<R, E, A>(fa: Observable<R, E, A>): Observable<R, E, boolean> {
  return fa.operate((source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: () => {
          subscriber.next(false);
          subscriber.complete();
        },
        complete: () => {
          subscriber.next(true);
          subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus getter fncts.observable.Observable materialize
 */
export function materialize<R, E, A>(fa: Observable<R, E, A>): Observable<R, never, Notification<E, A>> {
  return fa.operate((source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          subscriber.next(Notification.next(value));
        },
        error: (error) => {
          subscriber.next(Notification.error(error));
        },
        complete: () => {
          subscriber.next(Notification.complete());
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable mergeAll
 */
export function mergeAll_<R, E, R1, E1, A>(
  self: Observable<R, E, ObservableInput<R1, E1, A>>,
  concurrent = Infinity,
): Observable<R | R1, E | E1, A> {
  return self.mergeMap(Function.identity, concurrent);
}

/**
 * @tsplus fluent fncts.observable.Observable mergeScanWithIndex
 */
export function mergeScanWithIndex<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (index: number, acc: B, value: A) => ObservableInput<R1, E1, B>,
  concurrent = Infinity,
): Observable<R | R1, E | E1, B> {
  return fa.operate((source, subscriber, environment) => {
    let state = initial;
    return mergeInternal(
      source,
      subscriber,
      environment,
      (index, value) => f(index, state, value),
      concurrent,
      (value) => {
        state = value;
      },
      false,
      undefined,
      () => (state = null!),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable mergeScan
 */
export function mergeScan_<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (acc: B, value: A) => ObservableInput<R1, E1, B>,
  concurrent = Infinity,
): Observable<R | R1, E | E1, B> {
  return fa.mergeScanWithIndex(initial, (_, b, a) => f(b, a), concurrent);
}

export function onErrorResumeNext<R, E, A, O extends ReadonlyArray<ObservableInput<any, any>>>(
  fa: Observable<R, E, A>,
  ...sources: O
): Observable<
  R | Observable.EnvironmentOf<O[number]>,
  E | Observable.ErrorOf<O[number]>,
  A | Observable.TypeOf<O[number]>
> {
  return fa.operate((source, subscriber, environment) => {
    const remaining     = [source, ...sources];
    const subscribeNext = () => {
      if (!subscriber.closed) {
        if (remaining.length > 0) {
          let nextSource: Observable<
            R | Observable.EnvironmentOf<O[number]>,
            E | Observable.ErrorOf<O[number]>,
            A | Observable.TypeOf<O[number]>
          >;
          try {
            nextSource = from(remaining.shift()!);
          } catch (err) {
            subscribeNext();
            return;
          }
          const innerSub = operatorSubscriber(subscriber, { error: noop, complete: noop });
          subscriber.add(nextSource.provideEnvironment(environment).subscribe(innerSub));
          innerSub.add(subscribeNext);
        } else {
          subscriber.complete();
        }
      }
    };
    subscribeNext();
  });
}

/**
 * @tsplus fluent fncts.observable.Observable onEmpty
 */
export function onEmpty_<R, E, A, B>(fa: Observable<R, E, A>, f: Lazy<B>): Observable<R, E, A | B> {
  return fa.operate((source, subscriber, environment) => {
    let hasValue = false;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          hasValue = true;
          subscriber.next(value);
        },
        complete: () => {
          if (!hasValue) {
            subscriber.next(f());
          }
          subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable repeat
 */
export function repeat_<R, E, A>(fa: Observable<R, E, A>, count = Infinity): Observable<R, E, A> {
  return count <= 0
    ? empty()
    : fa.operate((source, subscriber, environment) => {
        let repeats = 0;
        let innerSub: Subscription | null;
        const loop  = () => {
          let syncUnsub = false;
          innerSub      = source.provideEnvironment(environment).subscribe(
            operatorSubscriber(subscriber, {
              complete: () => {
                if (++repeats < count) {
                  if (innerSub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    loop();
                  } else {
                    syncUnsub = true;
                  }
                } else {
                  subscriber.complete;
                }
              },
            }),
          );

          if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            loop();
          }
        };
        loop();
      });
}

export interface RetryConfig {
  readonly count: number;
  readonly resetOnSuccess?: boolean;
}

/**
 * @tsplus fluent fncts.observable.Observable retry
 */
export function retry_<R, E, A>(fa: Observable<R, E, A>, count?: number): Observable<R, E, A>;
export function retry_<R, E, A>(fa: Observable<R, E, A>, config: RetryConfig): Observable<R, E, A>;
export function retry_<R, E, A>(
  fa: Observable<R, E, A>,
  configOrCount: number | RetryConfig = Infinity,
): Observable<R, E, A> {
  let config: RetryConfig;
  if (configOrCount && typeof configOrCount === "object") {
    config = configOrCount;
  } else {
    config = {
      count: configOrCount,
    };
  }

  const { count, resetOnSuccess = false } = config;

  return count <= 0
    ? fa
    : fa.operate((source, subscriber, environment) => {
        let retries = 0;
        let innerSub: Subscription | null;
        const loop  = () => {
          let syncUnsub = false;
          innerSub      = source.provideEnvironment(environment).subscribe(
            operatorSubscriber(subscriber, {
              next: (value) => {
                if (resetOnSuccess) {
                  retries = 0;
                }
                subscriber.next(value);
              },
              error: (err) => {
                if (retries++ < count) {
                  if (innerSub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    loop();
                  } else {
                    syncUnsub = true;
                  }
                } else {
                  subscriber.error(err);
                }
              },
            }),
          );
          if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            loop();
          }
        };
        loop();
      });
}

/**
 * @tsplus fluent fncts.observable.Observable sample
 */
export function sample_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  notifier: Observable<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    let hasValue            = false;
    let lastValue: A | null = null;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          hasValue  = true;
          lastValue = value;
        },
      }),
    );
    const emit = () => {
      if (hasValue) {
        hasValue    = false;
        const value = lastValue!;
        lastValue   = null;
        subscriber.next(value);
      }
    };
    notifier.provideEnvironment(environment).subscribe(operatorSubscriber(subscriber, { next: emit, complete: noop }));
  });
}

/**
 * @tsplus fluent fncts.observable.Observable sampleTime
 */
export function sampleTime_<R, E, A>(
  fa: Observable<R, E, A>,
  period: number,
  scheduler: SchedulerLike = asyncScheduler,
): Observable<R, E, A> {
  return sample_(fa, interval(period, scheduler));
}

/**
 * @tsplus fluent fncts.observable.Observable scanLeftWithIndex
 */
export function scanLeftWithIndex<R, E, A, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (index: number, acc: B, value: A) => B,
): Observable<R, E, B> {
  return fa.operate(scanInternal(f, initial, true, true));
}

/**
 * @tsplus fluent fncts.observable.Observable scanLeft
 */
export function scanLeft<R, E, A, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (acc: B, value: A) => B,
): Observable<R, E, B> {
  return fa.scanLeftWithIndex(initial, (_, b, a) => f(b, a));
}

/**
 * @tsplus static fncts.observable.ObservableOps service
 */
export function service<S>(/** @tsplus auto */ tag: Tag<S>): Observable<S, never, S> {
  return Observable.serviceWithObservable((service) => Observable.of(service), tag);
}

/**
 * @tsplus static fncts.observable.ObservableOps serviceWith
 */
export function serviceWith<S, A>(f: (service: S) => A, /** @tsplus auto */ tag: Tag<S>): Observable<S, never, A> {
  return Observable.serviceWithObservable((service) => Observable.of(f(service)), tag);
}

/**
 * @tsplus static fncts.observable.ObservableOps serviceWithObservable
 */
export function serviceWithObservable<S, R, E, A>(
  f: (service: S) => Observable<R, E, A>,
  /** @tsplus auto */ tag: Tag<S>,
): Observable<S | R, E, A> {
  return Observable.environmentWithObservable((environment) => f(environment.unsafeGet(tag)));
}

/**
 * @tsplus fluent fncts.observable.Observable skip
 */
export function skip_<R, E, A>(fa: Observable<R, E, A>, count: number): Observable<R, E, A> {
  return fa.filterWithIndex((index, _) => count <= index);
}

/**
 * @tsplus fluent fncts.observable.Observable skipLast
 */
export function skipLast_<R, E, A>(fa: Observable<R, E, A>, skipCount: number): Observable<R, E, A> {
  return skipCount <= 0
    ? fa
    : fa.operate((source, subscriber, environment) => {
        let ring: A[] = new Array(skipCount);
        let seen      = 0;
        source.provideEnvironment(environment).subscribe(
          operatorSubscriber(subscriber, {
            next: (value) => {
              const valueIndex = seen++;
              if (valueIndex < skipCount) {
                ring[valueIndex] = value;
              } else {
                const index    = valueIndex % skipCount;
                const oldValue = ring[index];
                ring[index]    = value;
                subscriber.next(oldValue!);
              }
            },
          }),
        );

        return () => {
          ring = null!;
        };
      });
}

/**
 * @tsplus fluent fncts.observable.Observable skipUntil
 */
export function skipUntil_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  notifier: Observable<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    let taking           = false;
    const skipSubscriber = operatorSubscriber(subscriber, {
      next: () => {
        skipSubscriber?.unsubscribe();
        taking = true;
      },
      complete: noop,
    });

    from(notifier).provideEnvironment(environment).subscribe(skipSubscriber);

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => taking && subscriber.next(value),
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable skipWhile
 */
export function skipWhile_<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
): Observable<R, E, A> {
  return fa.operate((source, subscriber, environment) => {
    let taking = false;
    let index  = 0;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => (taking || (taking = !predicate(index++, value))) && subscriber.next(value),
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable startWith
 */
export function startWith_<R, E, A, B extends ReadonlyArray<unknown>>(
  fa: Observable<R, E, A>,
  ...values: B
): Observable<R, E, A | B[number]> {
  return fa.operate((source, subscriber) => {
    // @ts-expect-error
    source.concat(values).subscribe(subscriber);
  });
}

/**
 * @tsplus fluent fncts.observable.Observable subscribeOn
 */
export function subscribeOn_<R, E, A>(
  fa: Observable<R, E, A>,
  scheduler: SchedulerLike,
  delay = 0,
): Observable<R, E, A> {
  return fa.operate((source, subscriber, environment) => {
    subscriber.add(scheduler.schedule(() => source.provideEnvironment(environment).subscribe(subscriber), delay));
  });
}

/**
 * @tsplus getter fncts.observable.Observable switchAll
 */
export function switchAll<R, E, R1, E1, A>(
  ffa: Observable<R, E, ObservableInput<R1, E1, A>>,
): Observable<R | R1, E | E1, A> {
  return switchMap_(ffa, Function.identity);
}

/**
 * @tsplus fluent fncts.observable.Observable switchMapWithIndex
 */
export function switchMapWithIndex<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  f: (index: number, value: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return operate_(fa, (source, subscriber, environment) => {
    let innerSubscriber: Subscriber<E | E1, B> | null = null;
    let index      = 0;
    let isComplete = false;

    const checkComplete = () => isComplete && !innerSubscriber && subscriber.complete();

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => {
            innerSubscriber?.unsubscribe();
            const outerIndex = index++;
            from(f(outerIndex, value))
              .provideEnvironment(environment)
              .subscribe(
                (innerSubscriber = operatorSubscriber(subscriber, {
                  next: (innerValue) => subscriber.next(innerValue),
                  complete: () => {
                    innerSubscriber = null!;
                    checkComplete();
                  },
                })),
              );
          },
        },
        () => {
          isComplete = true;
          checkComplete();
        },
      ),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable switchMap
 */
export function switchMap_<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  f: (value: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return fa.switchMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.observable.Observable switchScanWithIndex
 */
export function switchScanWithIndex<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (index: number, acc: B, value: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return operate_(fa, (source, subscriber, environment) => {
    let state = initial;
    switchMapWithIndex(source, (index, value) => from(f(index, state, value)).map((b) => ((state = b), b)))
      .provideEnvironment(environment)
      .subscribe(subscriber);
    return () => {
      state = null!;
    };
  });
}

/**
 * @tsplus fluent fncts.observable.Observable switchScan
 */
export function switchScan_<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  initial: B,
  f: (acc: B, value: A) => ObservableInput<R1, E1, B>,
): Observable<R | R1, E | E1, B> {
  return fa.switchScanWithIndex(initial, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.observable.Observable take
 */
export function take_<R, E, A>(fa: Observable<R, E, A>, count: number): Observable<R, E, A> {
  return count <= 0
    ? empty()
    : fa.operate((source, sub, environment) => {
        let seen = 0;
        source.provideEnvironment(environment).subscribe(
          new OperatorSubscriber(sub, {
            next: (value) => {
              if (++seen <= count) {
                sub.next(value);
                if (count <= seen) {
                  sub.complete();
                }
              }
            },
          }),
        );
      });
}

/**
 * @tsplus fluent fncts.observable.Observable takeLast
 */
export function takeLast_<R, E, A>(fa: Observable<R, E, A>, count: number): Observable<R, E, A> {
  return count <= 0
    ? empty()
    : fa.operate((source, subscriber, environment) => {
        let buffer: A[] = [];
        source.provideEnvironment(environment).subscribe(
          operatorSubscriber(
            subscriber,
            {
              next: (value) => {
                buffer.push(value);
                count < buffer.length && buffer.shift();
              },
              complete: () => {
                for (const value of buffer) {
                  subscriber.next(value);
                }
                subscriber.complete();
              },
            },
            () => {
              buffer = null!;
            },
          ),
        );
      });
}

/**
 * @tsplus fluent fncts.observable.Observable takeUntil
 */
export function takeUntil_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  notifier: ObservableInput<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    from(notifier)
      .provideEnvironment(environment)
      .subscribe(operatorSubscriber(subscriber, { next: () => subscriber.complete(), complete: noop }));
    !subscriber.closed && source.provideEnvironment(environment).subscribe(subscriber);
  });
}

/**
 * @tsplus fluent fncts.observable.Observable takeWhileWithIndex
 */
export function takeWhileWithIndex<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: RefinementWithIndex<number, A, B>,
  inclusive?: boolean,
): Observable<R, E, B>;
export function takeWhileWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
  inclusive?: boolean,
): Observable<R, E, A>;
export function takeWhileWithIndex<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: PredicateWithIndex<number, A>,
  inclusive?: boolean,
): Observable<R, E, A> {
  return fa.operate((source, subscriber, environment) => {
    let index = 0;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          const result = predicate(index++, value);
          (result || inclusive) && subscriber.next(value);
          !result && subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable takeWhile
 */
export function takeWhile_<R, E, A, B extends A>(
  fa: Observable<R, E, A>,
  refinement: Refinement<A, B>,
  inclusive?: boolean,
): Observable<R, E, B>;
export function takeWhile_<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: Predicate<A>,
  inclusive?: boolean,
): Observable<R, E, A>;
export function takeWhile_<R, E, A>(
  fa: Observable<R, E, A>,
  predicate: Predicate<A>,
  inclusive?: boolean,
): Observable<R, E, A> {
  return fa.takeWhileWithIndex((_, a) => predicate(a), inclusive);
}

/**
 * @tsplus fluent fncts.observable.Observable tap
 */
export function tap_<R, E, A>(fa: Observable<R, E, A>, observer: Partial<Observer<E, A>>): Observable<R, E, A> {
  return fa.operate((source, subscriber, environment) => {
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          observer.next?.(value);
          subscriber.next(value);
        },
        error: (err) => {
          observer.error?.(err);
          subscriber.error(err);
        },
        complete: () => {
          observer.complete?.();
          subscriber.complete();
        },
      }),
    );
  });
}

export interface ThrottleConfig {
  readonly leading?: boolean;
  readonly trailing?: boolean;
}

export const defaultThrottleConfig: ThrottleConfig = {
  leading: true,
  trailing: false,
};

/**
 * @tsplus fluent fncts.observable.Observable throttle
 */
export function throttle_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  durationSelector: (a: A) => ObservableInput<R1, E1, any>,
  { leading, trailing }: ThrottleConfig = defaultThrottleConfig,
): Observable<R | R1, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    let sendValue: Maybe<A>            = Nothing();
    let throttled: Subscription | null = null;
    let isComplete                     = false;

    const endThrottling = () => {
      throttled?.unsubscribe();
      throttled = null;
      if (trailing) {
        send();
        isComplete && subscriber.complete();
      }
    };

    const cleanupThrottling = () => {
      throttled = null;
      isComplete && subscriber.complete();
    };

    const startThrottling = (value: A) =>
      (throttled = from(durationSelector(value))
        .provideEnvironment(environment)
        .subscribe(operatorSubscriber(subscriber, { next: endThrottling, complete: cleanupThrottling })));

    const send = () => {
      if (sendValue.isJust()) {
        const { value } = sendValue;
        sendValue       = Nothing();
        subscriber.next(value);
        !isComplete && startThrottling(value);
      }
    };

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          sendValue = Just(value);
          !(throttled && !throttled.closed) && (leading ? send() : startThrottling(value));
        },
        complete: () => {
          isComplete = true;
          !(trailing && sendValue.isJust() && throttled && !throttled.closed) && subscriber.complete();
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable throttleTime
 */
export function throttleTime_<R, E, A>(
  fa: Observable<R, E, A>,
  duration: number,
  scheduler: SchedulerLike = asyncScheduler,
  config = defaultThrottleConfig,
): Observable<R, E, A> {
  const duration$ = timer(duration, scheduler);
  return throttle_(fa, () => duration$, config);
}

export type TimeoutConfig<R, E, A, B, M = unknown> = (
  | { readonly each: number; readonly first?: number | Date }
  | { readonly each?: number; readonly first: number | Date }
) & {
  readonly scheduler?: SchedulerLike;
  readonly with?: (info: TimeoutInfo<A, M>) => ObservableInput<R, E, B>;
  meta?: M;
};

export interface TimeoutInfo<A, M> {
  readonly meta?: M;
  readonly seen: number;
  readonly lastValue: Maybe<A>;
}

export class TimeoutError<A, M> extends Error {
  constructor(readonly info: TimeoutInfo<A, M> | null) {
    super("Timeout has occurred");
    this.name = "TimeoutError";
  }
}

/**
 * @tsplus fluent fncts.observable.Observable timeout
 */
export function timeout_<R, E, A, R1, E1, B, M = unknown>(
  fa: Observable<R, E, A>,
  config: TimeoutConfig<R1, E1, A, B, M> & { readonly with: (info: TimeoutInfo<A, M>) => ObservableInput<R1, E1, B> },
): Observable<R | R1, E | E1, A | B>;
export function timeout_<R, E, A, M = unknown>(
  fa: Observable<R, E, A>,
  config: Omit<TimeoutConfig<never, never, A, any, M>, "with">,
): Observable<R, E | TimeoutError<A, M>, A>;
export function timeout_<R, E, A, R1, E1, B, M = unknown>(
  fa: Observable<R, E, A>,
  config: any,
): Observable<R | R1, E | E1 | TimeoutError<A, M>, A | B> {
  const {
    first,
    each,
    with: _with = timeoutError,
    scheduler = asyncScheduler,
    meta = null!,
  } = config as TimeoutConfig<R, E1, A, B, M>;
  return operate_(fa, (source, subscriber, environment) => {
    // eslint-disable-next-line prefer-const
    let originalSourceSubscription: Subscription;
    let timerSubscription: Subscription;
    let lastValue: Maybe<A> = Nothing();
    let seen                = 0;
    const startTimer        = (delay: number) => {
      timerSubscription = caughtSchedule(
        subscriber,
        scheduler,
        () => {
          originalSourceSubscription.unsubscribe();
          from<R | R1, E1 | TimeoutError<A, M>, B>(
            _with({
              meta,
              lastValue,
              seen,
            }),
          )
            .provideEnvironment(environment)
            .subscribe(subscriber);
        },
        delay,
      );
    };

    originalSourceSubscription = source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => {
            timerSubscription?.unsubscribe();
            seen++;
            lastValue = Just(value);
            subscriber.next(value);
            each! > 0 && startTimer(each!);
          },
        },
        () => {
          if (!timerSubscription?.closed) {
            timerSubscription?.unsubscribe();
          }
          lastValue = Nothing();
        },
      ),
    );

    startTimer(first != null ? (typeof first === "number" ? first : +first - scheduler.now()) : each!);
  });
}

function timeoutError<R, A, M>(info: TimeoutInfo<A, M>): Observable<R, TimeoutError<A, M>, never> {
  return fail(new TimeoutError(info));
}

function toArrayAccumulator(arr: any[], value: any) {
  return arr.push(value), arr;
}

/**
 * @tsplus getter fncts.observable.Observable toArray
 */
export function toArray<R, E, A>(fa: Observable<R, E, A>): Observable<R, E, ReadonlyArray<A>> {
  return operate_(fa, (source, subscriber, environment) => {
    source
      .foldLeft([] as A[], toArrayAccumulator)
      .provideEnvironment(environment)
      .subscribe(subscriber);
  });
}

/**
 * @tsplus fluent fncts.observable.Observable unique
 */
export function unique_<R, E, A, K, R1, E1 = never>(
  fa: Observable<R, E, A>,
  toKey?: (value: A) => K,
  flushes?: Observable<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return operate_(fa, (source, subscriber, environment) => {
    let distinctKeys = HashSet.makeDefault<A | K>();
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          const key = toKey ? toKey(value) : value;
          if (!distinctKeys.has(key)) {
            distinctKeys.add(key);
            subscriber.next(value);
          }
        },
      }),
    );
    flushes
      ?.provideEnvironment(environment)
      .subscribe(
        operatorSubscriber(subscriber, { next: () => (distinctKeys = HashSet.makeDefault()), complete: noop }),
      );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable uniqueUntilChanged
 */
export function uniqueUntilChanged_<R, E, A, K>(
  fa: Observable<R, E, A>,
  E: Eq<K>,
  keySelector: (value: A) => K,
): Observable<R, E, A>;
export function uniqueUntilChanged_<R, E, A, K>(
  fa: Observable<R, E, A>,
  equals: (x: K, y: K) => boolean,
  keySelector: (value: A) => K,
): Observable<R, E, A>;
export function uniqueUntilChanged_<R, E, A>(fa: Observable<R, E, A>, E: Eq<A>): Observable<R, E, A>;
export function uniqueUntilChanged_<R, E, A>(
  fa: Observable<R, E, A>,
  equals: (x: A, y: A) => boolean,
): Observable<R, E, A>;
export function uniqueUntilChanged_<R, E, A, K = A>(
  fa: Observable<R, E, A>,
  E: Eq<K> | ((x: K, y: K) => boolean),
  keySelector: (value: A) => K = Function.identity as (_: A) => K,
): Observable<R, E, A> {
  const compare = "equals" in E ? E.equals : E;
  return fa.operate((source, subscriber, environment) => {
    let previousKey: K;
    let first = true;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          const currentKey = keySelector(value);
          if (first || !compare(previousKey, currentKey)) {
            first       = false;
            previousKey = currentKey;
            subscriber.next(value);
          }
        },
      }),
    );
  });
}

/**
 * @tsplus fluent fncts.observable.Observable uniqueUntilKeyChanged
 */
export function uniqueUntilKeyChanged_<R, E, A, K extends keyof A>(
  fa: Observable<R, E, A>,
  key: K,
  E: Eq<A[K]>,
): Observable<R, E, A>;
export function uniqueUntilKeyChanged_<R, E, A, K extends keyof A>(
  fa: Observable<R, E, A>,
  key: K,
  equals: (x: A[K], y: A[K]) => boolean,
): Observable<R, E, A>;
export function uniqueUntilKeyChanged_<R, E, A, K extends keyof A>(
  fa: Observable<R, E, A>,
  key: K,
  equals: Eq<A[K]> | ((x: A[K], y: A[K]) => boolean),
): Observable<R, E, A> {
  const compare = "equals" in equals ? equals.equals : equals;
  return fa.uniqueUntilChanged((x, y) => compare(x[key], y[key]));
}

function combineLatestInternal(
  subscriber: Subscriber<any, any>,
  environment: Environment<any>,
  observables: ObservableInput<any, any, any>[],
  scheduler?: SchedulerLike,
  valueTransform: (values: any[]) => any = Function.identity,
) {
  return maybeSchedule(subscriber, scheduler, () => {
    const { length }         = observables;
    const values             = new Array(length);
    let active               = length;
    let remainingFirstValues = length;
    for (let i = 0; i < length; i++) {
      maybeSchedule(subscriber, scheduler, () => {
        const source      = scheduler ? scheduled(observables[i]!, scheduler) : from(observables[i]!);
        let hasFirstValue = false;
        source.provideEnvironment(environment).subscribe(
          operatorSubscriber(subscriber, {
            next: (value) => {
              values[i] = value;
              if (!hasFirstValue) {
                hasFirstValue = true;
                remainingFirstValues--;
              }
              if (!remainingFirstValues) {
                subscriber.next(valueTransform(values.slice()));
              }
            },
            complete: () => {
              if (!--active) {
                subscriber.complete();
              }
            },
          }),
        );
      });
    }
  });
}

function findInternal<A>(
  predicate: PredicateWithIndex<number, A>,
  emit: "value" | "index",
): <R, E>(source: Observable<R, E, A>, subscriber: Subscriber<E, any>, environment: Environment<R>) => void {
  const findIndex = emit === "index";
  return (source, subscriber, environment) => {
    let index = 0;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          const i = index++;
          if (predicate(index++, value)) {
            subscriber.next(findIndex ? i : Just(value));
            subscriber.complete();
          }
        },
        complete: () => {
          subscriber.next(findIndex ? -1 : Nothing());
          subscriber.complete();
        },
      }),
    );
  };
}

export function joinAllInternal<R, E, R1, E1, A, R2, E2, B>(
  fa: Observable<R, E, ObservableInput<R1, E1, A>>,
  joiner: (sources: ReadonlyArray<ObservableInput<R1, E1, A>>) => Observable<R2, E2, B>,
): Observable<R | R1 | R2, E | E1 | E2, B> {
  return fa.toArray.mergeMap(joiner);
}

function maybeSchedule(subscription: Subscription, scheduler: SchedulerLike | undefined, execute: () => void) {
  if (scheduler) {
    subscription.add(scheduler.schedule(execute));
  } else {
    execute();
  }
}

function mergeInternal<R, E, A, R1, E1, B>(
  source: Observable<R, E, A>,
  subscriber: Subscriber<E | E1, B>,
  environment: Environment<R | R1>,
  f: (i: number, a: A) => ObservableInput<R1, E1, B>,
  concurrent: number,
  onBeforeNext?: (innerValue: B) => void,
  expand?: boolean,
  innerSubScheduler?: SchedulerLike,
  additionalTeardown?: () => void,
) {
  const buffer: Array<A> = [];
  let active             = 0;
  let index              = 0;
  let isComplete         = false;

  const checkComplete = () => {
    if (isComplete && !buffer.length && !active) {
      subscriber.complete();
    }
  };

  const outerNext = (a: A) => (active < concurrent ? doInnerSub(a) : buffer.push(a));

  const doInnerSub = (a: A) => {
    expand && subscriber.next(a as any);
    active++;
    let innerComplete = false;
    from(f(index++, a))
      .provideEnvironment(environment)
      .subscribe(
        new OperatorSubscriber(
          subscriber,
          {
            next: (b) => {
              onBeforeNext?.(b);

              if (expand) {
                outerNext(b as any);
              } else {
                subscriber.next(b);
              }
            },
            complete: () => {
              innerComplete = true;
            },
          },
          () => {
            if (innerComplete) {
              try {
                active--;
                while (buffer.length && active < concurrent) {
                  const bufferedValue = buffer.shift()!;
                  innerSubScheduler
                    ? subscriber.add(innerSubScheduler.schedule(() => doInnerSub(bufferedValue)))
                    : doInnerSub(bufferedValue);
                }
                checkComplete();
              } catch (err) {
                subscriber.error(Cause.halt(err));
              }
            }
          },
        ),
      );
  };

  source.provideEnvironment(environment).subscribe(
    new OperatorSubscriber(subscriber, {
      next: outerNext,
      complete: () => {
        isComplete = true;
        checkComplete();
      },
    }),
  );

  return () => {
    additionalTeardown?.();
  };
}

export function scanInternal<R, E, A, B>(
  f: (index: number, acc: A, value: A) => B,
  initial: B,
  hasInitial: false,
  emitOnNext: boolean,
  emitBeforeComplete?: undefined | true,
): (source: Observable<R, E, A>, subscriber: Subscriber<any, any>) => void;
export function scanInternal<R, E, A, B>(
  f: (index: number, acc: B, value: A) => B,
  initial: B,
  hasInitial: true,
  emitOnNext: boolean,
  emitBeforeComplete?: undefined | true,
): (source: Observable<R, E, A>, subscriber: Subscriber<any, any>) => void;
export function scanInternal<R, E, A, B>(
  f: (index: number, acc: A | B, value: A) => B,
  initial: B,
  hasInitial: boolean,
  emitOnNext: boolean,
  emitBeforeComplete?: undefined | true,
): (source: Observable<R, E, A>, subscriber: Subscriber<any, any>, environment: Environment<R>) => void {
  return (source, subscriber, environment) => {
    let hasState   = hasInitial;
    let state: any = initial;
    let index      = 0;
    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          const i = index++;
          state   = hasState ? f(i, state, value) : ((hasState = true), value);
          emitOnNext && subscriber.next(state);
        },
        complete:
          emitBeforeComplete &&
          (() => {
            hasState && subscriber.next(state);
            subscriber.complete();
          }),
      }),
    );
  };
}
