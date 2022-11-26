export const CachedVariance = Symbol.for("fncts.io.Cached.Variance");
export type CachedVariance = typeof CachedVariance;

export const CachedTypeId = Symbol.for("fncts.io.Cached");
export type CachedTypeId = typeof CachedTypeId;

export abstract class CachedInternal<Error, Resource> extends Cached<Error, Resource> {
  abstract get: FIO<Error, Resource>;
  abstract refresh: FIO<Error, void>;
}
