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
