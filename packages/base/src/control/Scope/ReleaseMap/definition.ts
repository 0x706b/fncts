import type { HashMap } from "../../../collection/immutable/HashMap.js";
import type { Exit } from "../../../data/Exit.js";
import type { HKT } from "../../../prelude.js";
import type { Ref } from "../../Ref.js";
import type { Finalizer } from "../Finalizer.js";

import { Newtype } from "../../../data/Newtype.js";

export class Exited {
  readonly _tag = "Exited";
  constructor(
    readonly nextKey: number,
    readonly exit: Exit<any, any>,
    readonly update: (_: Finalizer) => Finalizer,
  ) {}
}

export class Running {
  readonly _tag = "Running";
  constructor(
    readonly nextKey: number,
    readonly finalizers: HashMap<number, Finalizer>,
    readonly update: (_: Finalizer) => Finalizer,
  ) {}
}

export type State = Exited | Running;

interface ReleaseMapN extends HKT {
  readonly type: ReleaseMap;
}

/**
 * @tsplus type fncts.control.Scope.ReleaseMap
 */
export interface ReleaseMap
  extends Newtype<
    {
      readonly ReleaseMap: unique symbol;
    },
    Ref<State>
  > {}

/**
 * @tsplus type fncts.control.Scope.ReleaseMapOps
 */
export interface ReleaseMapOps extends Newtype.Iso<ReleaseMapN> {}

export const ReleaseMap: ReleaseMapOps = Newtype<ReleaseMapN>();