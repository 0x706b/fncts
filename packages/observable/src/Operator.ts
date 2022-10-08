export interface Operator<E, A> {
  call(subscriber: Subscriber<E, A>, source: any, environment: Environment<any>): Finalizer;
}

export class OperatorSubscriber<E, A> extends Subscriber<E, A> {
  constructor(destination: Subscriber<any, any>, observer: Partial<Observer<E, A>>, private onFinalize?: () => void) {
    super(destination);
    this.next = observer.next
      ? function (this: OperatorSubscriber<E, A>, value: A) {
          try {
            observer.next!(value);
          } catch (err) {
            destination.error(Cause.halt(err));
          }
        }
      : super.next;
    this.error = observer.error
      ? function (this: OperatorSubscriber<E, A>, error: Cause<E>) {
          try {
            observer.error!(error);
          } catch (err) {
            destination.error(Cause.halt(err));
            this.unsubscribe();
          } finally {
            if (error.failureOrCause.isRight()) {
              this.unsubscribe();
            }
          }
        }
      : super.error;
    this.complete = observer.complete
      ? function (this: OperatorSubscriber<E, A>) {
          try {
            observer.complete!();
          } catch (err) {
            destination.error(Cause.halt(err));
          } finally {
            this.unsubscribe();
          }
        }
      : super.complete;
  }

  unsubscribe() {
    const { closed } = this;
    super.unsubscribe();
    !closed && this.onFinalize?.();
  }
}

export function operatorSubscriber<E, A, E1, A1>(
  destination: Subscriber<E1, A1>,
  observer: Partial<Observer<E, A>>,
  onFinalize?: () => void,
): OperatorSubscriber<E, A> {
  return new OperatorSubscriber(destination, observer, onFinalize);
}

/**
 * @tsplus fluent fncts.observable.Observable operate
 */
export function operate_<R, E, A, R1, E1, A1>(
  source: Observable<R, E, A>,
  f: (
    source: Observable<R, E, A>,
    subscriber: Subscriber<E1, A1>,
    environment: Environment<R | R1>,
  ) => (() => void) | void,
): Observable<R1, E1, A1> {
  return source.lift(function (
    this: Subscriber<E1, A1>,
    liftedSource: Observable<R, E, A>,
    environment: Environment<R | R1>,
  ) {
    try {
      f(liftedSource, this, environment);
    } catch (err) {
      this.error(Cause.halt(err));
    }
  });
}
