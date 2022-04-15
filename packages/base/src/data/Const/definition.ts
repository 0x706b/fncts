/**
 * @tsplus type fncts.Const
 */
export type Const<E, A> = E & { readonly _A: A };

/**
 * @tsplus type fncts.ConstOps
 */
export interface ConstOps {}

export const Const: ConstOps = {};
