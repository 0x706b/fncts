import type { IO, URIO } from "../definition";

import { Managed } from "../../Managed";

/**
 * @tsplus getter fncts.control.IO toManaged
 */
export function toManaged<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): Managed<R, E, A> {
  return Managed.fromIO(self);
}

/**
 * @tsplus fluent fncts.control.IO toManagedWith
 */
export function toManagedWith_<R, E, A, R1>(
  self: IO<R, E, A>,
  release: (a: A) => URIO<R1, any>,
  __tsplusTrace?: string,
): Managed<R & R1, E, A> {
  return Managed.bracket(self, release);
}
