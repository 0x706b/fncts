import { Described } from "@fncts/query/Described";

/**
 * @tsplus static fncts.query.QueryOps environment
 */
export function environment<R>(): Query<R, never, Environment<R>> {
  return Query.fromIO(IO.environment<R>());
}

/**
 * @tsplus static fncts.query.QueryOps environmentWith
 */
export function environmentWith<R, A>(f: (environment: Environment<R>) => A): Query<R, never, A> {
  return Query.environment<R>().map(f);
}

/**
 * @tsplus static fncts.query.QueryOps environmentWithQuery
 */
export function environmentWithQuery<R0, R, E, A>(
  f: (environment: Environment<R0>) => Query<R, E, A>,
): Query<R0 | R, E, A> {
  return Query.environment<R0>().flatMap(f);
}

/**
 * @tsplus static fncts.query.QueryOps environmentWithIO
 */
export function environmentWithIO<R0, R, E, A>(f: (environment: Environment<R0>) => IO<R, E, A>): Query<R0 | R, E, A> {
  return Query.environment<R0>().mapIO(f);
}

/**
 * @tsplus pipeable fncts.query.Query contramapEnvironment
 */
export function contramapEnvironment<R0, R>(
  f: Described<(_: Environment<R0>) => Environment<R>>,
  __tsplusTrace?: string,
) {
  return <E, A>(self: Query<R, E, A>): Query<R0, E, A> => {
    return new Query(self.step.map((result) => result.contramapEnvironment(f)).contramapEnvironment((r) => f.value(r)));
  };
}

/**
 * @tsplus pipeable fncts.query.Query provideEnvironment
 */
export function provideEnvironment<R>(environment: Described<Environment<R>>, __tsplusTrace?: string) {
  return <E, A>(self: Query<R, E, A>): Query<never, E, A> => {
    return self.contramapEnvironment(new Described(() => environment.value, `() => ${environment.description}`));
  };
}

/**
 * @tsplus pipeable fncts.query.Query provideSomeEnvironment
 */
export function provideSomeEnvironment<R0>(environment: Described<Environment<R0>>, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): Query<Exclude<R, R0>, E, A> => {
    return self.contramapEnvironment(
      new Described((r) => r.union(environment.value), "Environment<R> => Environment<R | R0>"),
    );
  };
}

/**
 * @tsplus pipeable fncts.query.Query provideLayer
 */
export function provideLayer<RIn, E1, ROut>(layer: Lazy<Described<Layer<RIn, E1, ROut>>>, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): Query<RIn | Exclude<R, ROut>, E | E1, A> => {
    return new Query(
      IO.scoped(() => {
        const layer0 = layer();
        return layer0.value.build.result.flatMap((exit) =>
          exit.match(
            (cause) => IO.succeedNow(Result.fail(cause)),
            (r) => self.provideSomeEnvironment(new Described(r, layer0.description)).step,
          ),
        );
      }) as IO<RIn | Exclude<R, ROut>, never, Result<Exclude<R, ROut>, E | E1, A>>,
    );
  };
}
