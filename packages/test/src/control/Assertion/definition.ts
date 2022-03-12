import type { AssertionValue } from "../../data/AssertionValue.js";
import type { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra.js";
import type { Render } from "../../data/Render.js";

import { IO } from "@fncts/base/control/IO";

import { AssertionIO } from "../AssertionIO.js";

/**
 * @tsplus type fncts.data.FreeBooleanAlgebra
 */
export type AssertResult<A> = FreeBooleanAlgebra<AssertionValue<A>>;

/**
 * @tsplus type fncts.test.control.Assertion
 * @tsplus companion fncts.test.control.AssertionOps
 */
export class Assertion<A> extends AssertionIO<A> {
  constructor(readonly render: Render, readonly run: (actual: A) => AssertResult<A>) {
    super(render, (actual) => IO.succeedNow(run(actual)));
  }
}
