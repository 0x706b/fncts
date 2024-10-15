export interface ShareConfig<R, E, A, R1 = never, E1 = never, R2 = never, E2 = never, R3 = never, E3 = never> {
  readonly connector?: () => Subject<R, E, A>;
  readonly resetOnDefect?: boolean | ((err: unknown) => Observable<R1, E1, any>);
  readonly resetOnComplete?: boolean | (() => Observable<R2, E2, any>);
  readonly resetOnRefCountZero?: boolean | (() => Observable<R3, E3, any>);
}

/**
 * @tsplus pipeable fncts.observable.Observable share
 */
export function share<R, E, A, R1 = never, E1 = never, R2 = never, E2 = never, R3 = never, E3 = never>(
  options: ShareConfig<R, E, A, R1, E1, R2, E2, R3, E3> = {},
) {
  return (fa: Observable<R, E, A>): Observable<R | R1 | R2, E | E1 | E2 | E3, A> => {
    const {
      connector = () => new Subject<R, E, A>(),
      resetOnDefect = true,
      resetOnComplete = true,
      resetOnRefCountZero = true,
    } = options;
    let connection: Subscriber<E, A> | null  = null;
    let resetConnection: Subscription | null = null;
    let subject: Subject<R, E, A> | null     = null;
    let refCount      = 0;
    let hasCompleted  = false;
    let hasErrored    = false;
    const cancelReset = () => {
      resetConnection?.unsubscribe();
      resetConnection = null;
    };
    const reset = () => {
      cancelReset();
      connection   = subject = null;
      hasCompleted = hasErrored = false;
    };
    const resetAndUnsubscribe = () => {
      const conn = connection;
      reset();
      conn?.unsubscribe();
    };
    return new Observable((subscriber, environment) => {
      refCount++;
      if (!hasErrored && !hasCompleted) {
        cancelReset();
      }
      const dest = (subject ||= connector());
      subscriber.add(() => {
        refCount--;
        if (refCount === 0 && !hasErrored && !hasCompleted) {
          resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero, environment);
        }
      });
      dest.provideEnvironment(environment).subscribe(subscriber);
      if (!connection) {
        connection = new Subscriber({
          next: (value) => dest.next(value),
          error: (defect) => {
            hasErrored = true;
            cancelReset();
            resetConnection = handleReset(reset, resetOnDefect, environment, defect);
            dest.error(defect);
          },
          complete: () => {
            hasCompleted = true;
            cancelReset();
            resetConnection = handleReset(reset, resetOnComplete, environment);
            dest.complete();
          },
        });
        Observable.from(fa).provideEnvironment(environment).subscribe(connection);
      }
    });
  };
}

function handleReset<T extends unknown[] = never[]>(
  reset: () => void,
  on: boolean | ((...args: T) => Observable<any, any, any>),
  environment: Environment<any>,
  ...args: T
): Subscription | null {
  if (on === true) {
    reset();
    return null;
  }
  if (on === false) {
    return null;
  }
  return on(...args)
    .take(1)
    .provideEnvironment(environment)
    .subscribe({ next: () => reset() });
}
