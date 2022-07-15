export declare namespace Observable {
  export type TypeOf<X> = X extends ObservableInput<any, infer A> ? A : never;
  export type ErrorOf<X> = X extends ObservableInput<infer E, any> ? E : never;
}

export const ObservableTypeId = Symbol.for("@principia/observable/Observable");
export type ObservableTypeId = typeof ObservableTypeId;

/**
 * @tsplus type fncts.observable.Observable
 * @tsplus companion fncts.observable.ObservableOps
 */
export class Observable<E, A> implements Subscribable<E, A> {
  readonly _E!: () => E;
  readonly _A!: () => A;

  readonly [ObservableTypeId]: ObservableTypeId = ObservableTypeId;

  protected source: Observable<any, any> | undefined;
  protected operator: Operator<E, A> | undefined;

  constructor(subscribe?: (this: Observable<E, A>, subscriber: Subscriber<E, A>) => Finalizer) {
    if (subscribe) {
      this.subscribeInternal = subscribe;
    }
  }

  lift<E1, A1>(operator: Operator<E1, A1>): Observable<E1, A1> {
    const observable    = new Observable<E1, A1>();
    observable.source   = this;
    observable.operator = operator;
    return observable;
  }

  subscribe(observer?: Partial<Observer<E, A>>): Subscription;
  subscribe(observer?: (value: A) => void): Subscription;
  subscribe(observer?: Partial<Observer<E, A>> | ((value: A) => void)): Subscription {
    const subscriber: Subscriber<E, A> = isSubscriber(observer) ? observer : new SafeSubscriber(observer);

    subscriber.add(
      this.operator
        ? this.operator.call(subscriber, this.source)
        : this.source
        ? this.subscribeInternal(subscriber)
        : this.trySubscribe(subscriber),
    );

    return subscriber;
  }

  protected trySubscribe(subscriber: Subscriber<E, A>): Finalizer {
    try {
      return this.subscribeInternal(subscriber);
    } catch (err) {
      subscriber.error(Cause.halt(err));
      return noop;
    }
  }

  protected subscribeInternal(subscriber: Subscriber<E, A>): Finalizer {
    this.source?.subscribe(subscriber);
  }
}

export const EMPTY: Observable<never, never> = new Observable((subscriber) => subscriber.complete());

export function isObservable(u: unknown): u is Observable<unknown, unknown> {
  return isObject(u) && ObservableTypeId in u;
}
