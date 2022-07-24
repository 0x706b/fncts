/**
 * @tsplus type fncts.EitherT
 * @tsplus companion fncts.EitherTOps
 */
export class EitherT<F extends HKT, K, Q, W, X, I, S, R, FE, E, A> {
  constructor(readonly getEitherT: HKT.Kind<F, K, Q, W, X, I, S, R, FE, Either<E, A>>) {}
  declare [HKT.F]: F;
  declare [HKT.K]: () => K;
  declare [HKT.Q]: (_: Q) => void;
  declare [HKT.W]: () => W;
  declare [HKT.X]: () => X;
  declare [HKT.I]: (_: I) => void;
  declare [HKT.S]: () => S;
  declare [HKT.R]: (_: R) => void;
  declare [HKT.E]: () => FE;
  declare [HKT.A]: () => Either<E, A>;
  declare [HKT.T]: HKT.Kind<
    F,
    HKT._K<this>,
    HKT._Q<this>,
    HKT._W<this>,
    HKT._X<this>,
    HKT._I<this>,
    HKT._S<this>,
    HKT._R<this>,
    HKT._E<this>,
    HKT._A<this>
  >;
}
