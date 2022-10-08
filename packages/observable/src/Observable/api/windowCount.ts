/**
 * @tsplus fluent fncts.observable.Observable windowCount
 */
export function windowCount_<R, E, A>(
  fa: Observable<R, E, A>,
  windowSize: number,
  startWindowEvery = 0,
): Observable<R, E, Observable<never, E, A>> {
  const startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;

  return operate_(fa, (source, subscriber, environment) => {
    let windows = [new Subject<never, E, A>()];
    let count   = 0;

    subscriber.next(windows[0]!.asObservable());

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(
        subscriber,
        {
          next: (value) => {
            for (const window of windows) {
              window.next(value);
            }

            const c = count - windowSize + 1;
            if (c >= 0 && c % startEvery === 0) {
              windows.shift()!.complete();
            }

            if (++count && startEvery === 0) {
              const window = new Subject<never, E, A>();
              windows.push(window);
              subscriber.next(window.asObservable());
            }
          },
          complete: () => {
            while (windows.length > 0) {
              windows.shift()!.complete();
            }
            subscriber.complete();
          },
          error: (err) => {
            while (windows.length > 0) {
              windows.shift()!.error(err);
            }
            subscriber.error(err);
          },
        },
        () => {
          windows = null!;
        },
      ),
    );
  });
}
