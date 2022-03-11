import type { AssertionValue } from "../../data/AssertionValue";
import type { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra";
import type { Render } from "../../data/Render";

import { IO } from "@fncts/base/control/IO";

import { AssertionIO } from "../AssertionIO";

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
