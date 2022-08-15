import { arrayRemove } from "@fncts/observable/internal/util";

export interface SubjectLike<E, A> extends Observer<E, A>, Subscribable<E, A> {}

export class Subject<R, E, A> extends Observable<R, E, A> implements SubscriptionLike {
  closed = false;
  protected observers: Array<Observer<E, A>> = [];
  protected isStopped             = false;
  protected hasError              = false;
  protected thrownError: Cause<E> = null!;

  constructor() {
    super();
  }

  lift<R1, E1, B>(operator: Operator<E1, B>): Observable<R1, E1, B> {
    const subject    = new AnonymousSubject(this, this);
    subject.operator = operator as any;
    return subject as any;
  }

  next(value: A) {
    this.throwIfClosed();
    if (!this.isStopped) {
      const copy = this.observers.slice();
      for (const observer of copy) {
        observer.next(value);
      }
    }
  }

  error(err: Cause<E>) {
    this.throwIfClosed();
    if (!this.isStopped) {
      this.hasError       = this.isStopped = true;
      this.thrownError    = err;
      const { observers } = this;
      while (observers.length) {
        observers.shift()!.error(err);
      }
    }
  }

  complete() {
    this.throwIfClosed();
    if (!this.isStopped) {
      this.isStopped      = true;
      const { observers } = this;
      while (observers.length) {
        observers.shift()!.complete();
      }
    }
  }

  unsubscribe() {
    this.isStopped = this.closed = true;
    this.observers = null!;
  }

  get observed() {
    return this.observers?.length > 0;
  }

  protected throwIfClosed() {
    if (this.closed) {
      throw new Error("Object Unsubscribed");
    }
  }

  protected trySubscribe(subscriber: Subscriber<E, A>, environment: Environment<R>): Finalizer {
    this.throwIfClosed();
    return super.trySubscribe(subscriber, environment);
  }

  protected subscribeInternal(subscriber: Subscriber<E, A>): Subscription {
    this.throwIfClosed();
    this.checkFinalizedStatuses(subscriber);
    return this.innerSubscribe(subscriber);
  }

  protected innerSubscribe(subscriber: Subscriber<E, A>): Subscription {
    const { hasError, isStopped, observers } = this;
    return hasError || isStopped
      ? Subscription.empty
      : (observers.push(subscriber), new Subscription(() => arrayRemove(observers, subscriber)));
  }

  protected checkFinalizedStatuses(subscriber: Subscriber<any, any>) {
    const { hasError, thrownError, isStopped } = this;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (isStopped) {
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
  constructor(protected destination?: Observer<E, A>, source?: Observable<R, E, A>) {
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
    return this.source?.subscribe(subscriber) ?? Subscription.empty;
  }
}

export class AsyncSubject<R, E, A> extends Subject<R, E, A> {
  private value: Either<Cause<E>, A> | null = null;
  private hasValue   = false;
  private isComplete = false;

  /** @internal */
  protected checkFinalizedStatuses(subscriber: Subscriber<E, A>) {
    const { hasError, hasValue, value, thrownError, isStopped, isComplete } = this;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (isStopped || isComplete) {
      hasValue &&
        value!.match(
          (e) => subscriber.error(e),
          (a) => subscriber.next(a),
        );
      subscriber.complete();
    }
  }

  next(value: A) {
    if (!this.isStopped) {
      this.value    = Either.right(value);
      this.hasValue = true;
    }
  }

  error(err: Cause<E>) {
    if (!this.isStopped) {
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
