import type { Maybe } from "../../../data/Maybe";
import type { UManaged } from "../definition";

import { Just, Nothing } from "../../../data/Maybe";
import { Concurrency, IO } from "../../IO";
import { Managed } from "../definition";

/**
 * @tsplus static fncts.control.ManagedOps concurrency
 */
export const concurrency: UManaged<Maybe<number>> = Managed.fromIO(
  IO.concurrency
);

/**
 * @tsplus fluent fncts.control.Managed withConcurrency
 */
export function withConcurrency_<R, E, A>(
  ma: Managed<R, E, A>,
  n: number
): Managed<R, E, A> {
  return Concurrency.locallyManaged(Just(n)).apSecond(ma);
}

/**
 * @tsplus getter fncts.control.Managed withConcurrencyUnbounded
 */
export function withConcurrencyUnbounded<R, E, A>(
  ma: Managed<R, E, A>
): Managed<R, E, A> {
  return Concurrency.locallyManaged(Nothing()).apSecond(ma);
}
