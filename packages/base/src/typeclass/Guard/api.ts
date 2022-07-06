import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Guard } from "@fncts/base/typeclass/Guard/definition";
import { AssertionError } from "@fncts/base/util/assert";
import { isObject } from "@fncts/base/util/predicates";

/**
 * @tsplus fluent fncts.Guard __call
 */
export function is<A>(self: Guard<A>, u: unknown): u is A {
  return self.is(u);
}

/**
 * @tsplus fluent fncts.Guard refine
 * @tsplus operator fncts.Guard &&
 */
export function refine<A, B extends A>(self: Guard<A>, refinement: Refinement<A, B>): Guard<B>;
export function refine<A>(self: Guard<A>, predicate: Predicate<A>): Guard<A>;
export function refine<A>(self: Guard<A>, predicate: Predicate<A>): Guard<A> {
  return Guard(self.is && predicate);
}

/**
 * @tsplus fluent fncts.Guard assert
 */
export function assert<A>(self: Guard<A>, u: unknown): asserts u is A {
  if (!self.is(u)) {
    throw new AssertionError("Guard failed check failed");
  }
}
