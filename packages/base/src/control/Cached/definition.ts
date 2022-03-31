import type { FIO } from "../IO.js";

export const CachedTypeId = Symbol.for("fncts.base.control.Cached");
export type CachedTypeId = typeof CachedTypeId;

/**
 * A Cached is a possibly resourceful value that is loaded into memory, and
 * which can be refreshed either manually or automatically
 *
 * @tsplus type fncts.control.Cached
 * @tsplus companion fncts.control.CachedOps
 */
export abstract class Cached<Error, Resource> {
  readonly _typeId: CachedTypeId = CachedTypeId;
  abstract get: FIO<Error, Resource>;
  abstract refresh: FIO<Error, void>;
}
