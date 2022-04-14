interface DictionaryN extends HKT {
  readonly type: Dictionary<this["A"]>;
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
