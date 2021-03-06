/**
 * @tsplus static fncts.observable.ObservableOps race
 */
export function race<O extends ReadonlyArray<ObservableInput<any, any>>>(
  ...sources: O
): Observable<Observable.ErrorOf<O[number]>, Observable.TypeOf<O[number]>> {
  return sources.length === 1 ? Observable.from(sources[0]!) : new Observable(raceInit(sources));
}

export function raceInit<E, A>(sources: ReadonlyArray<ObservableInput<E, A>>) {
  return (subscriber: Subscriber<E, A>) => {
    let subscriptions: Subscription[] = [];
    for (let i = 0; subscriptions && !subscriber.closed && i < sources.length; i++) {
      subscriptions.push(
        Observable.from(sources[i]!).subscribe(
          operatorSubscriber(subscriber, {
            next: (value) => {
              if (subscriptions) {
                for (let s = 0; s < subscriptions.length; s++) {
                  s !== i && subscriptions[s]!.unsubscribe();
                }
                subscriptions = null!;
              }
              subscriber.next(value);
            },
          }),
        ),
      );
    }
  };
}
