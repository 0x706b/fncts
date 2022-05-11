interface DictionaryN extends HKT {
  readonly [HKT.T]: Dictionary<HKT._A<this>>;
}

/**
 * @tsplus type fncts.Dictionary
 */
export interface Dictionary<A>
  extends Newtype<
    {
      readonly Dictionary: unique symbol;
    },
    Readonly<Record<string, A>>
  > {}

/**
 * @tsplus type fncts.DictionaryOps
 */
export interface DictionaryOps extends NewtypeIso<DictionaryN> {}

export const Dictionary: DictionaryOps = Newtype<DictionaryN>();
