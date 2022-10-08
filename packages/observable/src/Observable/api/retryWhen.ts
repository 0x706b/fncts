/**
 * @tsplus fluent fncts.observable.Observable retryWhen
 */
export function retryWhen_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  notifier: (errors: Observable<never, never, Cause<E>>) => Observable<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return operate_(fa, (source, subscriber, environment) => {
    let innerSub: Subscription | null;
    let syncResub = false;
    let defects$: Subject<never, never, any>;

    const loop = () => {
      innerSub = source.provideEnvironment(environment).subscribe(
        operatorSubscriber(subscriber, {
          error: (err) => {
            if (!defects$) {
              defects$ = new Subject();
              notifier(defects$)
                .provideEnvironment(environment)
                .subscribe(
                  operatorSubscriber(subscriber, {
                    next: () => (innerSub ? loop() : (syncResub = true)),
                  }),
                );
            }
            if (defects$) {
              defects$.next(err);
            }
          },
        }),
      );
      if (syncResub) {
        innerSub.unsubscribe();
        innerSub  = null;
        syncResub = false;
        loop();
      }
    };

    loop();
  });
}

export function retryWhen<R1, E1>(
  notifier: (errors: Observable<never, never, any>) => Observable<R1, E1, any>,
): <R, E, A>(fa: Observable<R, E, A>) => Observable<R | R1, E | E1, A> {
  return (fa) => retryWhen_(fa, notifier);
}
