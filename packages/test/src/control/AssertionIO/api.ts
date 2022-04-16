import { Render } from "../../data/Render.js";
import { RenderParam } from "../../data/RenderParam.js";
import { AssertionIO } from "./definition.js";

/**
 * @tsplus fluent fncts.test.AssertionIO and
 * @tsplus operator fncts.test.AssertionIO &&
 */
export function and_<A>(self: AssertionIO<A>, that: AssertionIO<A>): AssertionIO<A> {
  return new AssertionIO(
    Render.infix(RenderParam(self), "&&", RenderParam(that)),
    (actual) => self.runIO(actual) && that.runIO(actual),
  );
}

/**
 * @tsplus fluent fncts.test.AssertionIO or
 * @tsplus operator fncts.test.AssertionIO ||
 */
export function or_<A>(self: AssertionIO<A>, that: AssertionIO<A>): AssertionIO<A> {
  return new AssertionIO(
    Render.infix(RenderParam(self), "||", RenderParam(that)),
    (actual) => self.runIO(actual) || that.runIO(actual),
  );
}

/**
 * @tsplus fluent fncts.test.AssertionIO label
 */
export function label_<A>(self: AssertionIO<A>, label: string): AssertionIO<A> {
  return new AssertionIO(Render.infix(RenderParam(self), ":", RenderParam(label)), self.runIO);
}
