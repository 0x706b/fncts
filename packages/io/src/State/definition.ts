import type { StateInternal } from "./internal.js";

import { StateTypeId } from "./internal.js";

/**
 * @tsplus type fncts.io.State
 * @tsplus companion fncts.io.StateOps
 */
export abstract class State<S> {
  readonly _A!: () => S;
  readonly _typeId: StateTypeId = StateTypeId;
}

/**
 * @tsplus macro remove
 */
export function concrete<A>(_: State<A>): asserts _ is StateInternal<A> {
  //
}
