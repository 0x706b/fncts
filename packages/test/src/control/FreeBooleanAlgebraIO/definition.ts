import type { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra.js";

/**
 * @tsplus type fncts.test.FreeBooleanAlgebraIO
 */
export type FreeBooleanAlgebraIO<R, E, A> = IO<R, E, FreeBooleanAlgebra<A>>;

/**
 * @tsplus type fncts.test.FreeBooleanAlgebraIOOps
 */
export interface FreeBooleanAlgebraIOOps {}

export const FreeBooleanAlgebraIO: FreeBooleanAlgebraIOOps = {};
