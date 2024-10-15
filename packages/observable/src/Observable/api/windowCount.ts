/**
 * @tsplus pipeable fncts.observable.Observable windowCount
 */
export function windowCount(windowSize: number, startWindowEvery = 0) {
  return <R, E, A>(fa: Observable<R, E, A>): Observable<R, E, Observable<never, E, A>> => {
    const startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;
    return new Observable((subscriber, environment) => {
      let windows = [new Subject<never, E, A>()];
      let count   = 0;
      subscriber.next(windows[0]!.asObservable());
      fa.provideEnvironment(environment).subscribe(
        subscriber.operate({
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
          finalize: () => {
            windows = null!;
          },
        }),
      );
    });
  };
}
