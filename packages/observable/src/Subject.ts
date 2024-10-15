export interface SubjectLike<E, A> extends Observer<E, A>, Subscribable<E, A> {}

/**
 * A Subject is a special type of Observable that allows values to be
 * multicasted to many Observers. Subjects are like EventEmitters.
 *
 * Every Subject is an Observable and an Observer. You can subscribe to a
 * Subject, and you can call next to feed values as well as error and complete.
 */
export class Subject<R, E, A> extends Observable<R, E, A> implements SubscriptionLike {
  _closed = false;

  protected currentObservers = new Map<number, Observer<E, A>>();
  private observersCount     = 0;
  private observerSnapshot: Array<Observer<E, A>> | undefined;

  protected hasError              = false;
  protected thrownError: Cause<E> = null!;

  constructor() {
    super();
  }

  get closed() {
    return this._closed;
  }

  get observers(): Array<Observer<E, A>> {
    return (this.observerSnapshot ??= Array.from(this.currentObservers.values()));
  }

  next(value: A) {
    if (!this._closed) {
      const { observers } = this;
      const len           = observers.length;
      for (let i = 0; i < len; i++) {
        observers[i].next(value);
      }
    }
  }

  error(err: Cause<E>) {
    if (!this._closed) {
      this.hasError       = this._closed = true;
      this.thrownError    = err;
      const { observers } = this;
      const len           = observers.length;
      for (let i = 0; i < len; i++) {
        observers[i].error(err);
      }
      this.clearObservers();
    }
  }

  complete() {
    if (!this._closed) {
      this._closed        = true;
      const { observers } = this;
      const len           = observers.length;
      for (let i = 0; i < len; i++) {
        observers[i].complete();
      }
      this.clearObservers();
    }
  }

  unsubscribe() {
    this._closed = true;
    this.clearObservers();
  }

  get observed() {
    return this.currentObservers.size > 0;
  }

  protected throwIfClosed() {
    if (this._closed) {
      throw new Error("Object Unsubscribed");
    }
  }

  protected clearObservers() {
    this.currentObservers.clear();
    this.observerSnapshot = undefined;
  }

  protected trySubscribe(subscriber: Subscriber<E, A>, environment: Environment<R>): Finalizer {
    this.throwIfClosed();
    return super.trySubscribe(subscriber, environment);
  }

  protected subscribeInternal(subscriber: Subscriber<E, A>): Subscription {
    this.checkFinalizedStatuses(subscriber);
    return this.innerSubscribe(subscriber);
  }

  protected innerSubscribe(subscriber: Subscriber<E, A>): Subscription {
    const { hasError, _closed: closed } = this;
    if (hasError || closed) {
      return Subscription.empty;
    }

    const { currentObservers } = this;

    const observerId = this.observersCount++;
    currentObservers.set(observerId, subscriber);
    this.observerSnapshot = undefined;
    subscriber.add(() => {
      currentObservers.delete(observerId);
      this.observerSnapshot = undefined;
    });
    return subscriber;
  }

  protected checkFinalizedStatuses(subscriber: Subscriber<any, any>) {
    const { hasError, thrownError, _closed: closed } = this;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (closed) {
      subscriber.complete();
    }
  }

  asObservable(): Observable<R, E, A> {
    const observable: any = new Observable<R, E, A>();
    observable.source     = this;
    return observable;
  }
}

export class AnonymousSubject<R, E, A> extends Subject<R, E, A> {
  constructor(
    protected destination?: Observer<E, A>,
    source?: Observable<R, E, A>,
  ) {
    super();
    this.source = source;
  }
  next(value: A) {
    this.destination?.next?.(value);
  }
  error(err: Cause<E>) {
    this.destination?.error?.(err);
  }
  complete() {
    this.destination?.complete?.();
  }

  /** @internal */
  protected subscribeInternal<E, A>(subscriber: Subscriber<E, A>) {
    return this.source?.provideEnvironment(this.environment).subscribe(subscriber) ?? Subscription.empty;
  }
}

export class AsyncSubject<R, E, A> extends Subject<R, E, A> {
  private value: Either<Cause<E>, A> | null = null;
  private hasValue   = false;
  private isComplete = false;

  /** @internal */
  protected checkFinalizedStatuses(subscriber: Subscriber<E, A>) {
    const { hasError, hasValue, value, thrownError, _closed: closed, isComplete } = this;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (closed || isComplete) {
      hasValue &&
        value!.match(
          (e) => subscriber.error(e),
          (a) => subscriber.next(a),
        );
      subscriber.complete();
    }
  }

  next(value: A) {
    if (!this._closed) {
      this.value    = Either.right(value);
      this.hasValue = true;
    }
  }

  error(err: Cause<E>) {
    if (!this._closed) {
      this.value    = Either.left(err);
      this.hasValue = true;
    }
  }

  complete() {
    const { hasValue, value, isComplete } = this;
    if (!isComplete) {
      this.isComplete = true;
      hasValue &&
        value!.match(
          (e) => super.error(e),
          (a) => super.next(a),
        );
      super.complete();
    }
  }
}
