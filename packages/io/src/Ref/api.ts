import type { PRef } from "./definition.js";

import { identity } from "@fncts/base/data/function";

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/collect.js";
export * from "./api/dimap.js";
export * from "./api/filter.js";
export * from "./api/get.js";
export * from "./api/match.js";
export * from "./api/matchAll.js";
export * from "./api/modify.js";
export * from "./api/set.js";
// codegen:end

/**
 * Returns a read only view of the `Ref`.
 *
 * @tsplus getter fncts.io.Ref readOnly
 * @tsplus getter fncts.io.Ref.Synchronized readOnly
 */
export function readOnly<RA, RB, EA, EB, A, B>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EA, EB, never, B> {
  return ref;
}

/**
 * Returns a write only view of the `Ref`.
 *
 * @tsplus getter fncts.io.Ref writeOnly
 * @tsplus getter fncts.io.Ref.Synchronized writeOnly
 */
export function writeOnly<RA, RB, EA, EB, A, B>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EA, void, A, never> {
  return ref.match(
    identity,
    () => undefined,
    Either.right,
    () => Either.left(undefined),
  );
}
