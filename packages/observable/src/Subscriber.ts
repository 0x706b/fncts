import { Cause } from "@fncts/base/data/Cause";
import { isFunction } from "@fncts/base/util/predicates";

import { config } from "./config.js";
import { reportUnhandledError } from "./internal/util.js";
import { Notification } from "./Notification.js";

export const SubscriberTypeId = Symbol.for("fncts.observable.Subscriber");
export type SubscriberTypeId = typeof SubscriberTypeId;

export interface SubscriberOverrides<E, A> {
  next?: (value: A) => void;
  error?: (error: Cause<E>) => void;
  complete?: () => void;
  finalize?: () => void;
}

/**
 * @tsplus type fncts.observable.Subscriber
 */
export class Subscriber<E, A> extends Subscription implements Observer<E, A> {
  readonly [SubscriberTypeId]: SubscriberTypeId = SubscriberTypeId;

  private isStopped = false;
  protected destination: Subscriber<E, A> | Observer<E, A> | null;

  protected readonly nextOverride: ((value: A) => void) | null       = null;
  protected readonly errorOverride: ((err: Cause<E>) => void) | null = null;
  protected readonly completeOverride: (() => void) | null           = null;

  constructor(
    destination?: Subscriber<E, A> | Partial<Observer<E, A>> | ((value: A) => void) | null,
    overrides?: SubscriberOverrides<E, A>,
  ) {
    super(overrides?.finalize);

    this.destination = destination instanceof Subscriber ? destination : createSafeObserver(destination);

    this.nextOverride     = overrides?.next ?? null;
    this.errorOverride    = overrides?.error ?? null;
    this.completeOverride = overrides?.complete ?? null;

    this.next     = this.nextOverride ? overrideNext : this.next;
    this.error    = this.errorOverride ? overrideError : this.error;
    this.complete = this.completeOverride ? overrideComplete : this.complete;

    if (hasAddAndUnsubscribe(destination)) {
      destination.add(this);
    }
  }

  next(value: A) {
    if (this.isStopped) {
      handleStoppedNotification(Notification.next(value), this);
    } else {
      this._next(value);
    }
  }
  error(err: Cause<E>) {
    if (this.isStopped) {
      handleStoppedNotification(Notification.error(err), this);
    } else {
      this.isStopped = true;
      this._error(err);
    }
  }
  complete() {
    if (this.isStopped) {
      handleStoppedNotification(Notification.complete(), this);
    } else {
      this.isStopped = true;
      this._complete();
    }
  }
  unsubscribe(): void {
    if (!this._closed) {
      this.isStopped = true;
      super.unsubscribe();
      this.destination = null;
    }
  }

  _next(value: A) {
    this.destination!.next(value);
  }

  _error(err: Cause<E>) {
    try {
      this.destination!.error(err);
    } finally {
      this.unsubscribe();
    }
  }

  _complete() {
    try {
      this.destination!.complete();
    } finally {
      this.unsubscribe();
    }
  }
}

function createSafeObserver<E, A>(
  observerOrNext?: Partial<Observer<E, A>> | ((value: A) => void) | null,
): Observer<E, A> {
  return new ConsumerObserver(
    !observerOrNext || isFunction(observerOrNext) ? { next: observerOrNext ?? undefined } : observerOrNext,
  );
}

export class ConsumerObserver<E, A> implements Observer<E, A> {
  private onError: (error: Cause<E>) => void = reportUnhandledError;
  constructor(private partialObserver: Partial<Observer<E, A>>) {
    this.onError = partialObserver.error ?? reportUnhandledError;
  }

  next(value: A): void {
    const { partialObserver } = this;
    if (partialObserver.next) {
      try {
        partialObserver.next(value);
      } catch (error) {
        this.onError(Cause.halt(error));
      }
    }
  }

  error(err: Cause<E>): void {
    const { partialObserver } = this;
    if (partialObserver.error) {
      try {
        partialObserver.error(err);
      } catch (error) {
        this.onError(Cause.halt(error));
      }
    } else {
      this.onError(err);
    }
  }

  complete(): void {
    const { partialObserver } = this;
    if (partialObserver.complete) {
      try {
        partialObserver.complete();
      } catch (error) {
        this.onError(Cause.halt(error));
      }
    }
  }
}

function overrideNext<E, A>(this: Subscriber<E, A>, value: A): void {
  try {
    this.nextOverride!(value);
  } catch (error) {
    this.destination!.error(Cause.halt(error));
  }
}

function overrideError<E, A>(this: Subscriber<E, A>, err: Cause<E>): void {
  try {
    this.errorOverride!(err);
  } catch (error) {
    this.destination!.error(Cause.halt(error));
  } finally {
    this.unsubscribe();
  }
}

function overrideComplete<E, A>(this: Subscriber<E, A>): void {
  try {
    this.completeOverride!();
  } catch (error) {
    this.destination!.error(Cause.halt(error));
  } finally {
    this.unsubscribe();
  }
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

function hasAddAndUnsubscribe(value: any): value is Subscription {
  return value && isFunction(value.unsubscribe) && isFunction(value.add);
}

export function isSubscriber(u: unknown): u is Subscriber<any, any> {
  return isObject(u) && SubscriberTypeId in u;
}

function handleStoppedNotification<E, A>(notification: Notification<E, A>, subscriber: Subscriber<E, A>) {
  const { onStoppedNotification } = config;
  onStoppedNotification && timeoutProvider.setTimeout(() => onStoppedNotification(notification, subscriber));
}
