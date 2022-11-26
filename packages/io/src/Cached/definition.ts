import type { CachedInternal } from "@fncts/io/Cached/internal";

import { CachedTypeId , CachedVariance } from "@fncts/io/Cached/internal";

/**
 * A Cached is a possibly resourceful value that is loaded into memory, and
 * which can be refreshed either manually or automatically
 *
 * @tsplus type fncts.io.Cached
 * @tsplus companion fncts.io.CachedOps
 */
export class Cached<Error, Resource> {
  readonly [CachedTypeId]: CachedTypeId = CachedTypeId;
  declare [CachedVariance]: {
    readonly _E: (_: never) => Error;
    readonly _A: (_: never) => Resource;
  };
}

/**
 * @tsplus macro remove
 */
export function concrete<E, A>(_: Cached<E, A>): asserts _ is CachedInternal<E, A> {
  //
}
