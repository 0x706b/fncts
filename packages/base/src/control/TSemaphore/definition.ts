import type { NewtypeIso } from "../../data/Newtype.js";
import type { HKT } from "../../prelude.js";
import type { UTRef } from "../TRef.js";

import { Newtype } from "../../data/Newtype.js";

interface TSemaphoreN extends HKT {
  readonly type: TSemaphore;
}

/**
 * @tsplus type fncts.control.TSemaphore
 */
export interface TSemaphore
  extends Newtype<
    {
      readonly TSemaphore: unique symbol;
    },
    UTRef<number>
  > {}

/**
 * @tsplus type fncts.control.TSemaphoreOps
 */
export interface TSemaphoreOps extends NewtypeIso<TSemaphoreN> {}

export const TSemaphore: TSemaphoreOps = Newtype<TSemaphoreN>();
