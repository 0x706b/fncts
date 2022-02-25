import type { IO } from "../IO";
import type { Finalizer } from "./Finalizer";

import { _A, _E, _R } from "../../types";
import { hasTypeId } from "../../util/predicates";

export const ManagedTypeId = Symbol.for("fncts.control.Managed");
export type ManagedTypeId = typeof ManagedTypeId;

/**
 * @tsplus type fncts.control.Managed
 * @tsplus companion fncts.control.ManagedOps
 */
export class Managed<R, E, A> {
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => A;
  readonly _typeId: ManagedTypeId = ManagedTypeId;
  constructor(readonly io: IO<R, E, readonly [Finalizer, A]>) {}
}

export type UManaged<A> = Managed<unknown, never, A>;

export type URManaged<R, A> = Managed<R, never, A>;

export type EManaged<E, A> = Managed<unknown, E, A>;

/**
 * @tsplus unify fncts.control.Managed
 */
export function unifyManaged<X extends Managed<any, any, any>>(
  _: X,
): Managed<
  [X] extends [Managed<infer R, any, any>] ? R : never,
  [X] extends [Managed<any, infer E, any>] ? E : never,
  [X] extends [Managed<any, any, infer A>] ? A : never
> {
  return _;
}

/**
 * @tsplus static fncts.control.ManagedOps isManaged
 */
export function isManaged(u: unknown): u is Managed<unknown, unknown, unknown> {
  return hasTypeId(u, ManagedTypeId);
}
