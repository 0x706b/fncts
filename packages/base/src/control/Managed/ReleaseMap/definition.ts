import type { HashMap } from "../../../collection/immutable/HashMap";
import type { Exit } from "../../../data/Exit";
import type { HKT } from "../../../prelude";
import type { Ref } from "../../Ref";
import type { Finalizer } from "../Finalizer";

import { Newtype } from "../../../data/Newtype";

export class Exited {
  readonly _tag = "Exited";
  constructor(
    readonly nextKey: number,
    readonly exit: Exit<any, any>,
    readonly update: (_: Finalizer) => Finalizer
  ) {}
}

export class Running {
  readonly _tag = "Running";
  constructor(
    readonly nextKey: number,
    readonly finalizers: HashMap<number, Finalizer>,
    readonly update: (_: Finalizer) => Finalizer
  ) {}
}

export type State = Exited | Running;

interface ReleaseMapN extends HKT {
  readonly type: ReleaseMap;
}

/**
 * @tsplus type fncts.control.Managed.ReleaseMap
 */
export interface ReleaseMap
  extends Newtype<
    {
      readonly ReleaseMap: unique symbol;
    },
    Ref<State>
  > {}

/**
 * @tsplus type fncts.control.Managed.ReleaseMapOps
 */
export interface ReleaseMapOps extends Newtype.Iso<ReleaseMapN> {}

export const ReleaseMap: ReleaseMapOps = Newtype<ReleaseMapN>();
