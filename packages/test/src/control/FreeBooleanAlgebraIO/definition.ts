import type { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra";
import type { IO } from "@fncts/base/control/IO";

/**
 * @tsplus type fncts.test.control.FreeBooleanAlgebraIO
 */
export type FreeBooleanAlgebraIO<R, E, A> = IO<R, E, FreeBooleanAlgebra<A>>;

/**
 * @tsplus type fncts.test.control.FreeBooleanAlgebraIOOps
 */
export interface FreeBooleanAlgebraIOOps {}

export const FreeBooleanAlgebraIO: FreeBooleanAlgebraIOOps = {};
