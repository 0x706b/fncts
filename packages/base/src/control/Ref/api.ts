import type { PRef } from "./definition";

import { Either } from "../../data/Either";
import { identity } from "../../data/function";

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/collect";
export * from "./api/dimap";
export * from "./api/filter";
export * from "./api/get";
export * from "./api/match";
export * from "./api/matchAll";
export * from "./api/modify";
export * from "./api/set";
// codegen:end

/**
 * Returns a read only view of the `Ref`.
 *
 * @tsplus getter fncts.control.Ref readOnly
 * @tsplus getter fncts.control.Ref.Synchronized readOnly
 */
export function readOnly<RA, RB, EA, EB, A, B>(
  ref: PRef<RA, RB, EA, EB, A, B>
): PRef<RA, RB, EA, EB, never, B> {
  return ref;
}

/**
 * Returns a write only view of the `Ref`.
 *
 * @tsplus getter fncts.control.Ref writeOnly
 * @tsplus getter fncts.control.Ref.Synchronized writeOnly
 */
export function writeOnly<RA, RB, EA, EB, A, B>(
  ref: PRef<RA, RB, EA, EB, A, B>
): PRef<RA, RB, EA, void, A, never> {
  return ref.match(
    identity,
    () => undefined,
    Either.right,
    () => Either.left(undefined)
  );
}
