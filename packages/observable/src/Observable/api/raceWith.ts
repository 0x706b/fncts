import { raceInit } from "./race.js";

/**
 * @tsplus fluent fncts.observable.Observablen raceWith
 */
export function raceWith_<E, A, O extends ReadonlyArray<ObservableInput<any, any>>>(
  fa: Observable<E, A>,
  ...sources: O
): Observable<E | Observable.ErrorOf<O[number]>, A | Observable.TypeOf<O[number]>> {
  return !sources.length
    ? fa
    : fa.operate((source, subscriber) => {
        raceInit([source, ...sources])(subscriber);
      });
}
