import { raceInit } from "./race.js";

/**
 * @tsplus fluent fncts.observable.Observablen raceWith
 */
export function raceWith_<R, E, A, O extends ReadonlyArray<ObservableInput<any, any>>>(
  fa: Observable<R, E, A>,
  ...sources: O
): Observable<
  R | Observable.EnvironmentOf<O[number]>,
  E | Observable.ErrorOf<O[number]>,
  A | Observable.TypeOf<O[number]>
> {
  return !sources.length
    ? fa
    : fa.operate((source, subscriber, environment) => {
        raceInit([source, ...sources])(subscriber, environment);
      });
}
