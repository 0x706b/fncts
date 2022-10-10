import { raceInit } from "./race.js";

/**
 * @tsplus pipeable fncts.observable.Observablen raceWith
 */
export function raceWith<O extends ReadonlyArray<ObservableInput<any, any>>>(...sources: O) {
  return <R, E, A>(
    fa: Observable<R, E, A>,
  ): Observable<
    R | Observable.EnvironmentOf<O[number]>,
    E | Observable.ErrorOf<O[number]>,
    A | Observable.TypeOf<O[number]>
  > => {
    return !sources.length
      ? fa
      : fa.operate((source, subscriber, environment) => {
          raceInit([source, ...sources])(subscriber, environment);
        });
  };
}
