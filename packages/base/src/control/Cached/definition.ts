import type { FIO } from "../IO.js";
import type { CachedInternal} from "./internal.js";

import { CachedTypeId } from "./internal.js";

/**
 * A Cached is a possibly resourceful value that is loaded into memory, and
 * which can be refreshed either manually or automatically
 *
 * @tsplus type fncts.control.Cached
 * @tsplus companion fncts.control.CachedOps
 */
export class Cached<Error, Resource> {
  readonly _E!: () => Error;
  readonly _A!: () => Resource;
  readonly _typeId: CachedTypeId = CachedTypeId;
}

/**
 * @tsplus macro remove
 */
export function concrete<E, A>(_: Cached<E, A>): asserts _ is CachedInternal<E, A> {
  //
}
