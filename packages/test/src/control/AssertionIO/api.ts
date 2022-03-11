import { Render } from "../../data/Render";
import { RenderParam } from "../../data/RenderParam";
import { AssertionIO } from "./definition";

/**
 * @tsplus fluent fncts.test.control.AssertionIO and
 * @tsplus operator fncts.test.control.AssertionIO &&
 */
export function and_<A>(self: AssertionIO<A>, that: AssertionIO<A>): AssertionIO<A> {
  return new AssertionIO(Render.infix(RenderParam(self), "&&", RenderParam(that)), (actual) => self.runIO(actual) && that.runIO(actual));
}

/**
 * @tsplus fluent fncts.test.control.AssertionIO or
 * @tsplus operator fncts.test.control.AssertionIO ||
 */
export function or_<A>(self: AssertionIO<A>, that: AssertionIO<A>): AssertionIO<A> {
  return new AssertionIO(Render.infix(RenderParam(self), "||", RenderParam(that)), (actual) => self.runIO(actual) || that.runIO(actual));
}

/**
 * @tsplus fluent fncts.test.control.AssertionIO label
 */
export function label_<A>(self: AssertionIO<A>, label: string): AssertionIO<A> {
  return new AssertionIO(Render.infix(RenderParam(self), ":", RenderParam(label)), self.runIO);
}

/**
 * @tsplus getter fncts.test.control.AssertionIO rendered
 */
export function rendered<A>(self: AssertionIO<A>): string {
  return self.render.rendered;
}
