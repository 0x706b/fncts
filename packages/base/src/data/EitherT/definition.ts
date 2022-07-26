/**
 * @tsplus type fncts.EitherT
 */
export type EitherT<F extends HKT, FC, K, Q, W, X, I, S, R, EF, E, A> = HKT.Kind<
  F,
  FC,
  K,
  Q,
  W,
  X,
  I,
  S,
  R,
  EF,
  Either<E, A>
>;

/**
 * @tsplus type fncts.EitherTOps
 */
export interface EitherTOps {}

export const EitherT: EitherTOps = {};
