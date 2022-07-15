import { arrayRemove } from "@fncts/observable/internal/util";

/**
 * @tsplus fluent fncts.observable.Observable windowToggle
 */
export function windowToggle_<E, A, E1, B, E2>(
  fa: Observable<E, A>,
  openings: ObservableInput<E1, B>,
  closingSelector: (openValue: B) => ObservableInput<E2, any>,
): Observable<E | E1 | E2, Observable<E, A>> {
  return operate_(fa, (source, subscriber) => {
    const windows: Subject<E, A>[] = [];

    const handleError = (err: Cause<E>) => {
      while (0 < windows.length) {
        windows.shift()!.error(err);
      }
      subscriber.error(err);
    };

    Observable.from(openings).subscribe(
      operatorSubscriber(subscriber, {
        next: (openValue) => {
          const window = new Subject<E, A>();
          windows.push(window);
          const closingSubscription = new Subscription();
          const closeWindow         = () => {
            arrayRemove(windows, window);
            window.complete();
            closingSubscription.unsubscribe();
          };

          let closingNotifier: Observable<E2, any>;

          try {
            closingNotifier = Observable.from(closingSelector(openValue));
          } catch (err) {
            handleError(Cause.halt(err));
            return;
          }

          subscriber.next(window.asObservable());

          closingSubscription.add(
            closingNotifier.subscribe(
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

    source.subscribe(
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
