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
    // @ts-expect-error
    return !sources.length ? fa : new Observable(raceInit([fa, ...sources]));
  };
}
