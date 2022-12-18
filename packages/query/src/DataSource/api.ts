import type { Conc } from "@fncts/base/collection/immutable/Conc";
import type { Described } from "@fncts/query/Described";

import { IO } from "@fncts/io/IO";
import { CompletedRequestMap } from "@fncts/query/CompletedRequestMap";
import { Batched, DataSource } from "@fncts/query/DataSource/definition";

/**
 * @tsplus pipeable fncts.query.DataSource contramap
 */
export function contamap<A, B>(f: Described<(b: B) => A>) {
  return <R>(self: DataSource<R, A>): DataSource<R, B> => {
    return new (class extends DataSource<R, B> {
      identifier = `${self.identifier}.contramap(${f.description})`;
      runAll(requests: Conc<Conc<B>>, __tsplusTrace?: string | undefined): IO<R, never, CompletedRequestMap> {
        return self.runAll(requests.map((_) => _.map(f.value)));
      }
    })();
  };
}

/**
 * @tsplus pipeable fncts.query.DataSource contramapEnvironment
 */
export function contramapEnvironment<R0, R>(
  f: Described<(_: Environment<R0>) => Environment<R>>,
  __tsplusTrace?: string,
) {
  return <A>(self: DataSource<R, A>): DataSource<R0, A> => {
    return new (class extends DataSource<R0, A> {
      identifier = `${self.identifier}.contramapEnvironment(${f.description})`;
      runAll(requests: Conc<Conc<A>>, __tsplusTrace?: string | undefined): IO<R0, never, CompletedRequestMap> {
        return self.runAll(requests).contramapEnvironment(f.value);
      }
    })();
  };
}

/**
 * @tsplus static fncts.query.BatchedOps make
 * @tsplus static fncts.query.DataSourceOps makeBatched
 */
export function makeBatched<R, A>(
  name: string,
  f: (requests: Conc<A>) => IO<R, never, CompletedRequestMap>,
): DataSource<R, A> {
  return new (class extends Batched<R, A> {
    identifier: string = name;
    run(requests: Conc<A>, __tsplusTrace?: string): IO<R, never, CompletedRequestMap> {
      return f(requests);
    }
  })();
}

/**
 * @tsplus static fncts.query.DataSourceOps make
 */
export function make<R, A>(
  name: string,
  f: (requests: Conc<Conc<A>>) => IO<R, never, CompletedRequestMap>,
): DataSource<R, A> {
  return new (class extends DataSource<R, A> {
    identifier: string = name;
    runAll(requests: Conc<Conc<A>>, __tsplusTrace?: string | undefined): IO<R, never, CompletedRequestMap> {
      return f(requests);
    }
  })();
}

/**
 * @tsplus static fncts.query.DataSourceOps fromFunction
 */
export function fromFunction<A extends Request<never, B>, B>(name: string, f: (a: A) => B): DataSource<never, A> {
  return new (class extends Batched<never, A> {
    run(requests: Conc<A>, __tsplusTrace?: string | undefined): IO<never, never, CompletedRequestMap> {
      return IO.succeedNow(requests.foldLeft(CompletedRequestMap.empty(), (map, k) => map.insert(k, Right(f(k)))));
    }
    identifier: string = name;
  })();
}

/**
 * @tsplus static fncts.query.DataSourceOps fromFunctionIO
 */
export function fromFunctionIO<R, E, A extends Request<E, B>, B>(
  name: string,
  f: (a: A) => IO<R, E, B>,
): DataSource<R, A> {
  return new (class extends Batched<R, A> {
    identifier: string = name;
    run(requests: Conc<A>, __tsplusTrace?: string | undefined): IO<R, never, CompletedRequestMap> {
      return IO.foreachConcurrent(requests, (a) => f(a).either.map((r) => [a, r] as const)).map((results) =>
        results.foldLeft(CompletedRequestMap.empty(), (map, [k, v]) => map.insert(k, v)),
      );
    }
  })();
}
