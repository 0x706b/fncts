export function repeatWhen_<R, E, A, R1, E1>(
  fa: Observable<R, E, A>,
  notifier: (notifications: Observable<never, never, void>) => Observable<R1, E1, any>,
): Observable<R | R1, E | E1, A> {
  return fa.operate((source, subscriber, environment) => {
    let innerSub: Subscription | null;
    let syncResub = false;
    let completions$: Subject<never, never, void>;
    let isNotifierComplete = false;
    let isMainComplete     = false;

    const checkComplete = () => isMainComplete && isNotifierComplete && (subscriber.complete(), true);

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
      innerSub       = source.provideEnvironment(environment).subscribe(
        operatorSubscriber(subscriber, {
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
}

export function repeatWhen<R1, E1>(
  notifier: (notifications: Observable<never, never, void>) => Observable<R1, E1, any>,
): <R, E, A>(fa: Observable<R, E, A>) => Observable<R | R1, E | E1, A> {
  return (fa) => repeatWhen_(fa, notifier);
}
