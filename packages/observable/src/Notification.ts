export const NextTypeId = Symbol.for("fncts.observable.Notification.Next");
export type NextTypeId = typeof NextTypeId;

export class Next<A> {
  readonly _tag                     = "Next";
  readonly [NextTypeId]: NextTypeId = NextTypeId;
  constructor(readonly value: A) {}
}

export const FailTypeId = Symbol.for("fncts.observable.Notification.Fail");
export type FailTypeId = typeof FailTypeId;

export class Fail<E> {
  readonly _tag                     = "Fail";
  readonly [FailTypeId]: FailTypeId = FailTypeId;
  constructor(readonly error: Cause<E>) {}
}

export const CompleteTypeId = Symbol.for("fncts.observable.Notification.Complete");
export type CompleteTypeId = typeof CompleteTypeId;

export class Complete {
  readonly _tag = "Complete";
  readonly [CompleteTypeId]: CompleteTypeId = CompleteTypeId;
}

const COMPLETE = new Complete();

/**
 * @tsplus type fncts.observable.Notification
 */
export type Notification<E, A> = Next<A> | Fail<E> | Complete;

/**
 * @tsplus type fncts.observable.NotificationOps
 */
export interface NotificationOps {}

export const Notification: NotificationOps = {};

/**
 * @tsplus static fncts.observable.NotificationOps next
 */
export function next<E = never, A = never>(value: A): Notification<E, A> {
  return new Next(value);
}

/**
 * @tsplus static fncts.observable.NotificationOps error
 */
export function error<E = never, A = never>(error: Cause<E>): Notification<E, A> {
  return new Fail(error);
}

/**
 * @tsplus static fncts.observable.NotificationOps complete
 */
export function complete<E = never, A = never>(): Notification<E, A> {
  return COMPLETE;
}

/**
 * @tsplus pipeable fncts.observable.Notification match
 */
export function match<E, A, B, C, F>(onNext: (a: A) => B, onFail: (e: Cause<E>) => C, onComplete: () => F) {
  return <D>(fa: Notification<E, A>): B | C | D | F => {
    switch (fa._tag) {
      case "Next":
        return onNext(fa.value);
      case "Fail":
        return onFail(fa.error);
      case "Complete":
        return onComplete();
    }
  };
}

/**
 * @tsplus pipeable fncts.observable.Notification observe
 */
export function observe<E, A>(observer: Partial<Observer<E, A>>) {
  return (notification: Notification<E, A>): void => {
    return notification.match(
      (a) => observer.next?.(a),
      (e) => observer.error?.(e),
      () => observer.complete?.(),
    );
  };
}
