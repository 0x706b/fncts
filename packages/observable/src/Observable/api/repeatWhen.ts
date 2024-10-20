/**
 * @tsplus pipeable fncts.observable.Observable repeatWhen
 */
export function repeatWhen<R1, E1>(
  notifier: (notifications: Observable<never, never, void>) => Observable<R1, E1, any>,
) {
  return <R, E, A>(fa: Observable<R, E, A>): Observable<R | R1, E | E1, A> => {
    return new Observable((subscriber, environment) => {
      let innerSub: Subscription | null;
      let syncResub = false;
      let completions$: Subject<never, never, void>;
      let isNotifierComplete     = false;
      let isMainComplete         = false;
      const checkComplete        = () => isMainComplete && isNotifierComplete && (subscriber.complete(), true);
      const getCompletionSubject = () => {
        if (!completions$) {
          completions$ = new Subject();
          notifier(completions$)
            .provideEnvironment(environment)
            .subscribe(
              operatorSubscriber(subscriber, {
                next: () => {
                  if (innerSub) {
                    loop();
                  } else {
                    syncResub = true;
                  }
                },
                complete: () => {
                  isNotifierComplete = true;
                  checkComplete();
                },
              }),
            );
        }
        return completions$;
      };
      const loop = () => {
        isMainComplete = false;
        innerSub       = fa.provideEnvironment(environment).subscribe(
          subscriber.operate({
            complete: () => {
              isMainComplete = true;
              !checkComplete() && getCompletionSubject().next();
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
