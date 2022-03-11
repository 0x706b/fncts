import type { AssertionValue } from "./definition";

import { showWithOptions } from "@fncts/base/prelude/Showable";

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
