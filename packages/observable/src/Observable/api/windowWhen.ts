/**
 * @tsplus fluent fncts.observable.Observable windowWhen
 */
export function windowWhen_<R, E, A>(
  fa: Observable<R, E, A>,
  closingSelector: () => ObservableInput<never, never, any>,
): Observable<R, E, Observable<never, E, A>> {
  return operate_(fa, (source, subscriber, environment) => {
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

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => window!.next(value),
          error: handleError,
          complete: () => {
            window!.complete();
            subscriber.complete();
          },
        },
        () => {
          closingSubscriber?.unsubscribe();
          window = null!;
        },
      ),
    );
  });
}
