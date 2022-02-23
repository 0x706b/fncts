import type { HKT } from "../../prelude";
import type { IO } from "../IO";
import type { Finalizer } from "./Finalizer";

import { Newtype } from "../../data/Newtype";
import { _A, _E, _R } from "../../types";

export interface ManagedN extends HKT {
  readonly type: Managed<this["R"], this["E"], this["A"]>;
  readonly variance: {
    R: "-";
    E: "+";
    A: "+";
  };
}

/**
 * @tsplus type fncts.control.Managed
 */
export interface Managed<R, E, A>
  extends Newtype<
    { readonly Managed: unique symbol },
    IO<R, E, readonly [Finalizer, A]>
  > {}

/**
 * @tsplus type fncts.control.ManagedOps
 */
export interface ManagedOps extends Newtype.Iso<ManagedN> {}

export const Managed: ManagedOps = Newtype<ManagedN>();

export type UManaged<A> = Managed<unknown, never, A>;

export type URManaged<R, A> = Managed<R, never, A>;

export type EManaged<E, A> = Managed<unknown, E, A>;

/**
 * @tsplus unify fncts.control.Managed
 */
export function unifyManaged<X extends Managed<any, any, any>>(
  _: X
): Managed<
  [X] extends [Managed<infer R, any, any>] ? R : never,
  [X] extends [Managed<any, infer E, any>] ? E : never,
  [X] extends [Managed<any, any, infer A>] ? A : never
> {
  return _;
}
