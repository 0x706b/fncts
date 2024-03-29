export interface DatumEitherF extends HKT {
  type: DatumEither<this["E"], this["A"]>;
  variance: {
    E: "+";
    A: "+";
  };
}

/**
 * @tsplus type fncts.DatumEither
 */
export type DatumEither<E, A> = Datum<Either<E, A>>;

/**
 * @tsplus type fncts.DatumEitherOps
 */
export interface DatumEitherOps {}

export const DatumEither: DatumEitherOps = {};
