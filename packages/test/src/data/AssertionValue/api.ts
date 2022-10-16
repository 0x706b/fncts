import { showWithOptions } from "@fncts/base/data/Showable";

import { AssertionValue } from "./definition.js";

/**
 * @tsplus pipeable fncts.test.data.AssertionValue label
 */
export function label(string: string) {
  return <A>(self: AssertionValue<A>): AssertionValue<A> => {
    return new AssertionValue(
      LazyValue(() => self.assertion.value.label(string)),
      self.value,
      self.result,
      self.expression,
      self.sourceLocation,
    );
  };
}

/**
 * @tsplus pipeable fncts.test.data.AssertionValue isSameAssertionAs
 */
export function isSameAssertionAs<A>(that: AssertionValue<A>) {
  return (self: AssertionValue<A>): boolean => {
    return self.assertion.value.rendered === that.assertion.value.rendered;
  };
}

/**
 * @tsplus pipeable fncts.test.data.AssertionValue showValue
 */
export function showValue(offset = 0) {
  return <A>(self: AssertionValue<A>): string => {
    return showWithOptions(self.value, { indentationLevel: offset });
  };
}

/**
 * @tsplus getter fncts.test.data.AssertionValue printAssertion
 */
export function printAssertion<A>(self: AssertionValue<A>): string {
  return self.assertion.value.rendered;
}

/**
 * @tsplus pipeable fncts.test.data.AssertionValue withContext
 */
export function withContext(expr: Maybe<string>, sourceLocation: Maybe<string>) {
  return <A>(self: AssertionValue<A>): AssertionValue<A> => {
    return new AssertionValue(self.assertion, self.value, self.result, expr, sourceLocation);
  };
}
