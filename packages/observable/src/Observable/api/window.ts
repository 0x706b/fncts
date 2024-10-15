/**
 * @tsplus pipeable fncts.observable.Observable window
 */
export function window(windowBoundaries: Observable<never, never, any>) {
  return <R, E, A>(fa: Observable<R, E, A>): Observable<R, E, Observable<never, E, A>> => {
    return new Observable((subscriber, environment) => {
      let windowSubject: Subject<never, E, A> = new Subject();
      subscriber.next(windowSubject.asObservable());
      const errorHandler = (err: Cause<E>) => {
        windowSubject.error(err);
        subscriber.error(err);
      };
      fa.provideEnvironment(environment).subscribe(
        subscriber.operate({
          next: (value) => windowSubject.next(value),
          error: errorHandler,
          complete: () => {
            windowSubject.complete();
            subscriber.complete();
          },
        }),
      );
      windowBoundaries.subscribe(
        operatorSubscriber(subscriber, {
          next: () => {
            windowSubject.complete();
            subscriber.next((windowSubject = new Subject()));
          },
          complete: noop,
          error: errorHandler,
        }),
      );
      return () => {
        windowSubject.unsubscribe();
        windowSubject = null!;
      };
    });
  };
}
