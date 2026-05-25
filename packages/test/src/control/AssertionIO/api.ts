import type { Assertion } from "../Assertion/definition.js";
import type { FreeBooleanAlgebraIO } from "../FreeBooleanAlgebraIO.js";
import type { AssertionValue } from "@fncts/test/data/AssertionValue";

import { AssertionData } from "@fncts/test/data/AssertionData";

import { Render } from "../../data/Render.js";
import { RenderParam } from "../../data/RenderParam.js";
import { AssertionIO } from "./definition.js";

/**
 * @tsplus pipeable fncts.test.AssertionIO and
 * @tsplus pipeable-operator fncts.test.AssertionIO &&
 */
export function and<A>(that: AssertionIO<A>) {
  return (self: AssertionIO<A>): AssertionIO<A> => {
    return new AssertionIO(
      Render.infix(RenderParam(self), "&&", RenderParam(that)),
      (actual) => self.runIO(actual) && that.runIO(actual),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.AssertionIO or
 * @tsplus pipeable-operator fncts.test.AssertionIO ||
 */
export function or<A>(that: AssertionIO<A>) {
  return (self: AssertionIO<A>): AssertionIO<A> => {
    return new AssertionIO(
      Render.infix(RenderParam(self), "||", RenderParam(that)),
      (actual) => self.runIO(actual) || that.runIO(actual),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.AssertionIO label
 */
export function label(label: string) {
  return <A>(self: AssertionIO<A>): AssertionIO<A> => {
    return new AssertionIO(Render.infix(RenderParam(self), ":", RenderParam(label)), self.runIO);
  };
}

/**
 * @tsplus static fncts.test.AssertionIOOps direct
 */
export function assertionDirect<A>(
  name: string,
  params: ReadonlyArray<RenderParam>,
  run: (actual: A) => FreeBooleanAlgebraIO<never, never, AssertionValue<A>>,
): AssertionIO<A> {
  return new AssertionIO(Render.fn(name, Conc.single(Conc.from(params))), run);
}
