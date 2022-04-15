export const CachedTypeId = Symbol.for("fncts.control.Cached");
export type CachedTypeId = typeof CachedTypeId;

export abstract class CachedInternal<Error, Resource> {
  readonly _E!: () => Error;
  readonly _A!: () => Resource;
  readonly _typeId: CachedTypeId = CachedTypeId;
  abstract get: FIO<Error, Resource>;
  abstract refresh: FIO<Error, void>;
}
