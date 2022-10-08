export declare namespace Observable {
  export type TypeOf<X> = X extends ObservableInput<any, any, infer A> ? A : never;
  export type ErrorOf<X> = X extends ObservableInput<any, infer E, any> ? E : never;
  export type EnvironmentOf<X> = X extends ObservableInput<infer R, any, any> ? R : never;
}

export const ObservableTypeId = Symbol.for("@principia/observable/Observable");
export type ObservableTypeId = typeof ObservableTypeId;

/**
 * @tsplus type fncts.observable.Observable
 * @tsplus companion fncts.observable.ObservableOps
 */
export class Observable<R, E, A> implements Subscribable<E, A>, AsyncIterable<A> {
  declare _R: () => R;
  declare _E: () => E;
  declare _A: () => A;

  readonly [ObservableTypeId]: ObservableTypeId = ObservableTypeId;

  protected source: Observable<any, any, any> | undefined;
  protected operator: Operator<E, A> | undefined;
  protected environment: Environment<any> = Environment();

  constructor(
    subscribe?: (this: Observable<R, E, A>, subscriber: Subscriber<E, A>, environment: Environment<R>) => Finalizer,
  ) {
    if (subscribe) {
      this.subscribeInternal = subscribe;
    }
  }

  [Symbol.asyncIterator]<E, A>(this: Observable<never, E, A>) {
    let done         = false;
    const queue: A[] = [];
    let error: Cause<E>;

    let resolveCurrent: ((a: A) => void) | undefined;
    let rejectCurrent: ((err: unknown) => void) | undefined;
    this.subscribe({
      next: (value) => {
        if (resolveCurrent) {
          resolveCurrent(value);
        } else {
          queue.push(value);
        }
      },
      error: (err) => {
        if (rejectCurrent) {
          rejectCurrent(err);
        } else {
          error = err;
        }
      },
      complete: () => {
        done = true;
      },
    });
    return {
      next() {
        if (error) {
          return Promise.reject(error);
        }
        if (done) {
          return Promise.resolve({ done, value: undefined });
        }
        if (queue.length) {
          return Promise.resolve({ done, value: queue.shift()! });
        }
        return new Promise<A>((resolve, reject) => {
          resolveCurrent = resolve;
          rejectCurrent  = reject;
        }).then((value) => {
          resolveCurrent = undefined;
          rejectCurrent  = undefined;
          return { done: false, value };
        });
      },
    };
  }

  lift<R1, E1, A1>(operator: Operator<E1, A1>): Observable<R1, E1, A1> {
    const observable    = new Observable<R1, E1, A1>();
    observable.source   = this;
    observable.operator = operator;
    return observable;
  }

  provideEnvironment(environment: Environment<R>): Observable<never, E, A>;
  provideEnvironment<In>(environment: Environment<In>): Observable<Exclude<R, In>, E, A>;
  provideEnvironment<In>(environment: Environment<In>): Observable<Exclude<R, In>, E, A> {
    const observable       = new Observable<never, E, A>(this.subscribeInternal);
    observable.source      = this.source;
    observable.operator    = this.operator;
    observable.environment = this.environment.union(environment);
    return observable;
  }

  subscribe<E, A>(this: Observable<never, E, A>, observer?: Partial<Observer<E, A>>): Subscription;
  subscribe<E, A>(this: Observable<never, E, A>, observer?: (value: A) => void): Subscription;
  subscribe<E, A>(
    this: Observable<never, E, A>,
    observer?: Partial<Observer<E, A>> | ((value: A) => void),
  ): Subscription {
    const subscriber: Subscriber<E, A> = isSubscriber(observer) ? observer : new SafeSubscriber(observer);

    subscriber.add(
      this.operator
        ? this.operator.call(subscriber, this.source, this.environment)
        : this.source
        ? this.subscribeInternal(subscriber, this.environment)
        : this.trySubscribe(subscriber, this.environment),
    );

    return subscriber;
  }

  protected trySubscribe(subscriber: Subscriber<E, A>, environment: Environment<any>): Finalizer {
    try {
      return this.subscribeInternal(subscriber, environment);
    } catch (err) {
      subscriber.error(Cause.halt(err));
      return noop;
    }
  }

  protected subscribeInternal(subscriber: Subscriber<E, A>, environment: Environment<any>): Finalizer {
    this.source?.provideEnvironment(environment).subscribe(subscriber);
  }
}

export class EnvironmentWith<R0, R, E, A> extends Observable<R0 | R, E, A> {
  private map: WeakMap<Environment<any>, Observable<any, any, any>> = new WeakMap();
  constructor(f: (environment: Environment<R0>) => Observable<R, E, A>) {
    super((subsciber, environment) => {
      if (!this.map.has(environment)) {
        this.map.set(environment, f(environment as Environment<R0>));
      }
      return this.map.get(environment)!.provideEnvironment(environment).subscribe(subsciber);
    });
  }
}

export const EMPTY: Observable<never, never, never> = new Observable((subscriber) => subscriber.complete());

export function isObservable(u: unknown): u is Observable<unknown, unknown, unknown> {
  return isObject(u) && ObservableTypeId in u;
}
