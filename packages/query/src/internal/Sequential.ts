import type { DataSource } from "@fncts/query/DataSource";
import type { BlockedRequest } from "@fncts/query/internal/BlockedRequest";

export const SequentialTypeId = Symbol.for("fncts.query.Sequential");
export type SequentialTypeId = typeof SequentialTypeId;

export const SequentialVariance = Symbol.for("fncts.query.Sequential.Variance");
export type SequentialVariance = typeof SequentialVariance;

/**
 * @tsplus type fncts.query.Sequential
 * @tsplus companion fncts.query.SequentialOps
 */
export class Sequential<R> {
  readonly [SequentialTypeId]: SequentialTypeId = SequentialTypeId;
  declare [SequentialVariance]: {
    readonly _R: (_: never) => R;
  };

  constructor(readonly map: HashMap<DataSource<any, any>, Conc<Conc<BlockedRequest<any>>>>) {}
}

/**
 * @tsplus pipeable fncts.query.Sequential concat
 */
export function concat<R1>(that: Sequential<R1>) {
  return <R>(self: Sequential<R>): Sequential<R | R1> => {
    return new Sequential(
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
 * @tsplus getter fncts.query.Sequential isEmpty
 */
export function isEmpty<R>(self: Sequential<R>): boolean {
  return self.map.isEmpty;
}

/**
 * @tsplus getter fncts.query.Sequential keys
 */
export function keys<R>(self: Sequential<R>): Iterable<DataSource<R, any>> {
  return self.map.keys;
}

/**
 * @tsplus getter fncts.query.Sequential toIterable
 */
export function toIterable<R>(
  self: Sequential<R>,
): Iterable<readonly [DataSource<R, any>, Conc<Conc<BlockedRequest<any>>>]> {
  return self.map;
}
