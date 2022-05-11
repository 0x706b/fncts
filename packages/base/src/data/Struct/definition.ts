interface StructN extends HKT {
  readonly [HKT.T]: Struct<HKT._A<this>>;
}

/**
 * @tsplus type fncts.Struct
 */
export interface Struct<A>
  extends Newtype<
    {
      readonly Struct: unique symbol;
    },
    A
  > {}

/**
 * @tsplus type fncts.StructOps
 */
export interface StructOps extends NewtypeIso<StructN> {}

export const Struct: StructOps = Newtype<StructN>();

export {};
