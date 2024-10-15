/**
 * @tsplus pipeable fncts.observable.Observable windowWhen
 */
export function windowWhen(closingSelector: () => ObservableInput<never, never, any>) {
  return <R, E, A>(fa: Observable<R, E, A>): Observable<R, E, Observable<never, E, A>> => {
    return new Observable((subscriber, environment) => {
      let window: Subject<never, E, A> | null;
      let closingSubscriber: Subscriber<E, any> | undefined;
      const handleError = (err: Cause<E>) => {
        window!.error(err);
        subscriber.error(err);
      };
      const openWindow = () => {
        closingSubscriber?.unsubscribe();
        window?.complete();
        window = new Subject();
        subscriber.next(window.asObservable());
        let closingNotifier: Observable<never, never, any>;
        try {
          closingNotifier = Observable.from(closingSelector());
        } catch (err) {
          handleError(Cause.halt(err));
          return;
        }
        closingNotifier.subscribe(
          (closingSubscriber = operatorSubscriber(subscriber, {
            next: openWindow,
            complete: openWindow,
            error: handleError,
          })),
        );
      };
      openWindow();
      fa.provideEnvironment(environment).subscribe(
        subscriber.operate({
          next: (value) => window!.next(value),
          error: handleError,
          complete: () => {
            window!.complete();
            subscriber.complete();
          },
          finalize: () => {
            closingSubscriber?.unsubscribe();
            window = null!;
          },
        }),
      );
    });
  };
}
