/**
 * @tsplus type fncts.data.Const
 */
export type Const<E, A> = E & { readonly _A: A };

/**
 * @tsplus type fncts.data.ConstOps
 */
export interface ConstOps {}

export const Const: ConstOps = {};
