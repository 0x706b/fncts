import type { AssertionValue } from "../../data/AssertionValue.js";
import type { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra.js";
import type { Render } from "../../data/Render.js";

import { AssertionIO } from "../AssertionIO.js";

/**
 * @tsplus type fncts.test.FreeBooleanAlgebra
 */
export type AssertResult<A> = FreeBooleanAlgebra<AssertionValue<A>>;

/**
 * @tsplus type fncts.test.Assertion
 * @tsplus companion fncts.test.AssertionOps
 */
export class Assertion<A> extends AssertionIO<A> {
  constructor(readonly render: Render, readonly run: (actual: A) => AssertResult<A>) {
    super(render, (actual) => IO.succeedNow(run(actual)));
  }
}
