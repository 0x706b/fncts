/**
 * @tsplus pipeable fncts.observable.Observable retryWhen
 */
export function retryWhen<E, R1, E1>(
  notifier: (errors: Observable<never, never, Cause<E>>) => Observable<R1, E1, any>,
) {
  return <R, A>(fa: Observable<R, E, A>): Observable<R | R1, E | E1, A> => {
    return new Observable((subscriber, environment) => {
      let innerSub: Subscription | null;
      let syncResub = false;
      let defects$: Subject<never, never, any>;
      const loop    = () => {
        innerSub = fa.provideEnvironment(environment).subscribe(
          subscriber.operate({
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
  };
}
