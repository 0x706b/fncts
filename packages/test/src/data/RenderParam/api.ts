import type { AssertionIO } from "../../control/AssertionIO/definition.js";
import type { RenderParam } from "./definition.js";

import { show } from "@fncts/base/typeclass/Showable";

import { isAssertionIO } from "../../control/AssertionIO/definition.js";
import { RenderAssertionIO, RenderParamTag, RenderValue } from "./definition.js";

/**
 * @tsplus static fncts.test.data.RenderParamOps __call
 */
export function param<A>(assertion: AssertionIO<A>): RenderParam;
export function param<A>(value: A): RenderParam;
export function param(value: any): RenderParam {
  if (isAssertionIO(value)) {
    return new RenderAssertionIO(value);
  }
  return new RenderValue(value);
}

/**
 * @tsplus getter fncts.test.data.RenderParam rendered
 */
export function rendered<A>(self: RenderParam<A>): string {
  switch (self._tag) {
    case RenderParamTag.AssertionIO:
      return self.assertion.rendered;
    case RenderParamTag.Value:
      return show(self.value);
  }
}
