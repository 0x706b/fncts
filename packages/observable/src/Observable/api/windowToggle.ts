import { arrayRemove } from "@fncts/observable/internal/util";

/**
 * @tsplus fluent fncts.observable.Observable windowToggle
 */
export function windowToggle_<R, E, A, R1, E1, B, R2, E2>(
  fa: Observable<R, E, A>,
  openings: ObservableInput<R1, E1, B>,
  closingSelector: (openValue: B) => ObservableInput<R2, E2, any>,
): Observable<R | R1 | R2, E | E1 | E2, Observable<never, E, A>> {
  return operate_(fa, (source, subscriber, environment) => {
    const windows: Subject<never, E, A>[] = [];

    const handleError = (err: Cause<E>) => {
      while (0 < windows.length) {
        windows.shift()!.error(err);
      }
      subscriber.error(err);
    };

    Observable.from(openings)
      .provideEnvironment(environment)
      .subscribe(
        operatorSubscriber(subscriber, {
          next: (openValue) => {
            const window = new Subject<never, E, A>();
            windows.push(window);
            const closingSubscription = new Subscription();
            const closeWindow         = () => {
              arrayRemove(windows, window);
              window.complete();
              closingSubscription.unsubscribe();
            };

            let closingNotifier: Observable<R2, E2, any>;

            try {
              closingNotifier = Observable.from(closingSelector(openValue));
            } catch (err) {
              handleError(Cause.halt(err));
              return;
            }

            subscriber.next(window.asObservable());

            closingSubscription.add(
              closingNotifier.provideEnvironment(environment).subscribe(
                operatorSubscriber(subscriber, {
                  next: closeWindow,
                  complete: noop,
                  error: closeWindow,
                }),
              ),
            );
          },
          complete: noop,
        }),
      );

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => {
            const windowsCopy = windows.slice();
            for (const window of windowsCopy) {
              window.next(value);
            }
          },
          error: handleError,
          complete: () => {
            while (0 < windows.length) {
              windows.shift()!.complete();
            }
            subscriber.complete();
          },
        },
        () => {
          while (0 < windows.length) {
            windows.shift()!.unsubscribe();
          }
        },
      ),
    );
  });
}
