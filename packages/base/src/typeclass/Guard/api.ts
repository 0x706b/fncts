import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Guard } from "@fncts/base/typeclass/Guard/definition";
import { AssertionError } from "@fncts/base/util/assert";
import { isObject } from "@fncts/base/util/predicates";
/**
 * @tsplus pipeable fncts.Guard __call
 */
export function is(u: unknown) {
  // @ts-expect-error
  return <A>(self: Guard<A>): u is A => {
    return self.is(u);
  };
}
/**
 * @tsplus pipeable fncts.Guard refine
 * @tsplus operator fncts.Guard &&
 */
export function refine<A, B extends A>(refinement: Refinement<A, B>): (self: Guard<A>) => Guard<B>;
export function refine<A>(predicate: Predicate<A>): (self: Guard<A>) => Guard<A>;
export function refine<A>(predicate: Predicate<A>) {
  return (self: Guard<A>): Guard<A> => {
    return Guard(self.is && predicate);
  };
}
/**
 * @tsplus pipeable fncts.Guard assert
 */
export function assert(u: unknown) {
  // @ts-expect-error
  return <A>(self: Guard<A>): asserts u is A => {
    if (!self.is(u)) {
      throw new AssertionError("Guard failed check failed");
    }
  };
}
