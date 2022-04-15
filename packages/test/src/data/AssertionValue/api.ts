import { showWithOptions } from "@fncts/base/typeclass/Showable";

import { AssertionValue } from "./definition.js";

/**
 * @tsplus fluent fncts.test.data.AssertionValue label
 */
export function label<A>(self: AssertionValue<A>, string: string): AssertionValue<A> {
  return new AssertionValue(
    LazyValue(() => self.assertion.value.label(string)),
    self.value,
    self.result,
    self.expression,
    self.sourceLocation,
  );
}

/**
 * @tsplus fluent fncts.test.data.AssertionValue isSameAssertionAs
 */
export function isSameAssertionAs<A>(self: AssertionValue<A>, that: AssertionValue<A>): boolean {
  return self.assertion.value.rendered === that.assertion.value.rendered;
}

/**
 * @tsplus fluent fncts.test.data.AssertionValue showValue
 */
export function showValue<A>(self: AssertionValue<A>, offset = 0): string {
  return showWithOptions(self.value, { indentationLevel: offset });
}

/**
 * @tsplus getter fncts.test.data.AssertionValue printAssertion
 */
export function printAssertion<A>(self: AssertionValue<A>): string {
  return self.assertion.value.rendered;
}

/**
 * @tsplus fluent fncts.test.data.AssertionValue withContext
 */
export function withContext<A>(
  self: AssertionValue<A>,
  expr: Maybe<string>,
  sourceLocation: Maybe<string>,
): AssertionValue<A> {
  return new AssertionValue(self.assertion, self.value, self.result, expr, sourceLocation);
}
