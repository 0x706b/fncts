import { Conc } from "@fncts/base/collection/immutable/Conc";
import { IO } from "@fncts/io/IO";
import { CompletedRequestMap } from "@fncts/query/CompletedRequestMap";

export const DataSourceTypeId = Symbol.for("fncts.query.DataSource");
export type DataSourceTypeId = typeof DataSourceTypeId;

export const DataSourceVariance = Symbol.for("fncts.query.DataSource.Variance");
export type DataSourceVariance = typeof DataSourceVariance;

/**
 * @tsplus type fncts.query.DataSource
 * @tsplus companion fncts.query.DataSourceOps
 */
export abstract class DataSource<out R, in A> implements Hashable, Equatable {
  readonly [DataSourceTypeId]: DataSourceTypeId = DataSourceTypeId;
  declare [DataSourceVariance]: {
    readonly _R: (_: never) => R;
    readonly _A: (_: A) => void;
  };

  /**
   * The data source's identifier.
   */
  abstract readonly identifier: string;
  /**
   * Execute a collection of requests. The outer `Chunk` represents batches of
   * requests that must be performed sequentially. The inner `Chunk` represents
   * a batch of requests that can be performed in parallel.
   */
  abstract runAll(requests: Conc<Conc<A>>, __tsplusTrace?: string): IO<R, never, CompletedRequestMap>;

  /**
   * Returns a data source that executes at most `n` requests in parallel.
   */
  batchN(n: number): DataSource<R, A> {
    const self = this;
    return new (class extends DataSource<R, A> {
      identifier: string = `${this.identifier}.batchN(${n})`;
      runAll(requests: Conc<Conc<A>>, __tsplusTrace?: string): IO<R, never, CompletedRequestMap> {
        if (n < 1) {
          return IO.halt(new IllegalArgumentError("n must be at least 1", "DataSource.batchN"));
        } else {
          return self.runAll(requests.foldLeft(Conc.empty(), (b, a) => b.concat(a.chunksOf(n))));
        }
      }
    })();
  }

  get [Symbol.hash]() {
    return Hashable.string(this.identifier);
  }

  [Symbol.equals](that: unknown): boolean {
    return isDataSource(that) && this.identifier === that.identifier;
  }
}

/**
 * @tsplus type fncts.query.Batched
 * @tsplus companion fncts.query.BatchedOps
 */
export abstract class Batched<R, A> extends DataSource<R, A> {
  abstract run(requests: Conc<A>, __tsplusTrace?: string): IO<R, never, CompletedRequestMap>;
  runAll(requests: Conc<Conc<A>>, __tsplusTrace?: string | undefined): IO<R, never, CompletedRequestMap> {
    return IO.foldLeft(requests, CompletedRequestMap.empty(), (completedRequestMap, requests) => {
      const newRequests: Conc<A> = requests.filter((a) => !completedRequestMap.contains(a));
      if (newRequests.isEmpty) return IO.succeedNow(completedRequestMap);
      else return this.run(newRequests).map((_) => completedRequestMap.concat(_));
    });
  }
}

export function isDataSource(u: unknown): u is DataSource<unknown, unknown> {
  return hasTypeId(u, DataSourceTypeId);
}
