import type { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra.js";

/**
 * @tsplus type fncts.test.control.FreeBooleanAlgebraIO
 */
export type FreeBooleanAlgebraIO<R, E, A> = IO<R, E, FreeBooleanAlgebra<A>>;

/**
 * @tsplus type fncts.test.control.FreeBooleanAlgebraIOOps
 */
export interface FreeBooleanAlgebraIOOps {}

export const FreeBooleanAlgebraIO: FreeBooleanAlgebraIOOps = {};
