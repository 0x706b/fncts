export const SubscriberTypeId = Symbol.for("fncts.observable.Subscriber");
export type SubscriberTypeId = typeof SubscriberTypeId;

export class Subscriber<E, A> extends Subscription implements Observer<E, A> {
  readonly [SubscriberTypeId]: SubscriberTypeId = SubscriberTypeId;

  private isStopped = false;
  protected observer: Subscriber<E, A> | Observer<E, A> | null;

  constructor(observer?: Subscriber<E, A> | Observer<E, A>) {
    super();
    if (observer) {
      this.observer = observer;
      if (isSubscription(observer)) {
        observer.add(this);
      }
    } else {
      this.observer = EMPTY_OBSERVER;
    }
  }
  next(value: A) {
    if (!this.isStopped) {
      this._next(value);
    }
  }
  error(err: Cause<E>) {
    if (!this.isStopped) {
      this.isStopped = true;
      this._error(err);
    }
  }
  complete() {
    if (!this.isStopped) {
      this.isStopped = true;
      this._complete();
    }
  }
  unsubscribe(): void {
    if (!this.closed) {
      this.isStopped = true;
      super.unsubscribe();
      this.observer = null;
    }
  }

  _next(value: A) {
    this.observer!.next(value);
  }

  _error(err: Cause<E>) {
    try {
      this.observer!.error(err);
    } finally {
      this.unsubscribe();
    }
  }

  _complete() {
    try {
      this.observer!.complete();
    } finally {
      this.unsubscribe();
    }
  }
}
export class SafeSubscriber<E, A> extends Subscriber<E, A> {
  constructor(observer?: Partial<Observer<E, A>> | ((value: A) => void)) {
    super();
    let next: ((value: A) => void) | undefined       = undefined;
    let error: ((err: Cause<E>) => void) | undefined = undefined;
    let complete: (() => void) | undefined           = undefined;
    if (isFunction(observer)) {
      next = observer;
    } else if (observer) {
      ({ next, error, complete } = observer);
      next     = next?.bind(observer);
      error    = error?.bind(observer);
      complete = complete?.bind(observer);
    }
    if (error) {
      this.observer = {
        next: next ? wrapDefectHandler(next, error) : noop,
        error: error ? wrapDefectHandler(error, error) : noop,
        complete: complete ? wrapDefectHandler(complete, error) : noop,
      };
    } else {
      this.observer = {
        next: next ? wrapThrowHandler(next) : noop,
        error: wrapThrowHandler(error ?? defaultErrorHandler),
        complete: complete ? wrapThrowHandler(complete) : noop,
      };
    }
  }
}

function wrapDefectHandler<E>(handler: (arg?: any) => void, onDefect: (err: Cause<E>) => void) {
  return (...args: any[]) => {
    try {
      handler(...args);
    } catch (err) {
      onDefect(Cause.halt(err));
    }
  };
}

function wrapThrowHandler(handler: (arg?: any) => void) {
  return (...args: any[]) => {
    try {
      handler(...args);
    } catch (err) {
      reportUnhandledError(err);
    }
  };
}

function defaultErrorHandler(error: any) {
  throw error;
}

export const EMPTY_OBSERVER: Readonly<Observer<any, any>> & {
  closed: true;
} = {
  closed: true,
  next: noop,
  error: defaultErrorHandler,
  complete: noop,
};

export function isSubscriber(u: unknown): u is Subscriber<any, any> {
  return isObject(u) && SubscriberTypeId in u;
}
