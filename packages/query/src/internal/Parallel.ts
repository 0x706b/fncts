import type { DataSource } from "@fncts/query/DataSource";
import type { BlockedRequest } from "@fncts/query/internal/BlockedRequest";

import { Sequential } from "@fncts/query/internal/Sequential";

export const ParallelTypeId = Symbol.for("fncts.query.Parallel");
export type ParallelTypeId = typeof ParallelTypeId;

export const ParallelVariance = Symbol.for("fncts.query.Parallel.Variance");
export type ParallelVariance = typeof ParallelVariance;

/**
 * @tsplus type fncts.query.Parallel
 * @tsplus companion fncts.query.ParallelOps
 */
export class Parallel<R> {
  readonly [ParallelTypeId]: ParallelTypeId = ParallelTypeId;
  declare [ParallelVariance]: {
    readonly _R: (_: never) => R;
  };

  constructor(readonly map: HashMap<DataSource<any, any>, Conc<BlockedRequest<any>>>) {}
}

/**
 * @tsplus pipeable fncts.query.Parallel concat
 */
export function concat<R1>(that: Parallel<R1>) {
  return <R>(self: Parallel<R>): Parallel<R | R1> => {
    return new Parallel(
      that.map.foldLeftWithIndex(self.map, (k, map, v) =>
        map.set(
          k,
          map.get(k).match(
            () => v,
            (requests) => requests.concat(v),
          ),
        ),
      ),
    );
  };
}

/**
 * @tsplus getter fncts.query.Parallel isEmpty
 */
export function isEmpty<R>(self: Parallel<R>): boolean {
  return self.map.isEmpty;
}

/**
 * @tsplus getter fncts.query.Parallel keys
 */
export function keys<R>(self: Parallel<R>): Iterable<DataSource<R, any>> {
  return self.map.keys;
}

/**
 * @tsplus getter fncts.query.Parallel toIterable
 */
export function toIterable<R>(self: Parallel<R>): Iterable<readonly [DataSource<R, any>, Conc<BlockedRequest<any>>]> {
  return self.map;
}

/**
 * @tsplus getter fncts.query.Parallel sequential
 */
export function sequential<R>(self: Parallel<R>): Sequential<R> {
  return new Sequential(self.map.map((v) => Conc(v)));
}

/**
 * @tsplus static fncts.query.ParallelOps __call
 */
export function makeParallel<R, A>(dataSource: DataSource<R, A>, blockedRequest: BlockedRequest<A>): Parallel<R> {
  return new Parallel(HashMap([dataSource, Conc(blockedRequest)]));
}

/**
 * @tsplus static fncts.query.ParallelOps empty
 */
export const empty: Parallel<never> = new Parallel(HashMap.empty());
