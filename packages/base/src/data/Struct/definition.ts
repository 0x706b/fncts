interface StructN extends HKT {
  readonly type: Struct<this["A"]>;
}

/**
 * @tsplus type fncts.data.Struct
 */
export interface Struct<A>
  extends Newtype<
    {
      readonly Struct: unique symbol;
    },
    A
  > {}

/**
 * @tsplus type fncts.data.StructOps
 */
export interface StructOps extends NewtypeIso<StructN> {}

export const Struct: StructOps = Newtype<StructN>();

export {};
