export const enum SyncOperatorTag {
  Map = "Map",
  Filter = "Filter",
  FilterMap = "FilterMap",
}

export interface Map<A, B> {
  readonly _tag: SyncOperatorTag.Map;
  readonly f: (a: A) => B;
}

export function Map<A, B>(f: (a: A) => B): Map<A, B> {
  return {
    _tag: SyncOperatorTag.Map,
    f,
  };
}

export interface Filter<A> {
  readonly _tag: SyncOperatorTag.Filter;
  readonly f: Predicate<A>;
}

export function Filter<A>(f: Predicate<A>): Filter<A> {
  return {
    _tag: SyncOperatorTag.Filter,
    f,
  };
}

export interface FilterMap<A, B> {
  readonly _tag: SyncOperatorTag.FilterMap;
  readonly f: (a: A) => Maybe<B>;
}

export function FilterMap<A, B>(f: (a: A) => Maybe<B>): FilterMap<A, B> {
  return {
    _tag: SyncOperatorTag.FilterMap,
    f,
  };
}

/**
 * @tsplus type fncts.io.Push.SyncOperator
 * @tsplus companion fncts.io.Push.SyncOperatorOps
 */
export type SyncOperator<A = any, B = any> = Map<A, B> | Filter<A> | FilterMap<A, B>;

type SyncOperatorFusionMap = {
  readonly [K in SyncOperator["_tag"]]: {
    readonly [K2 in SyncOperator["_tag"]]: (
      op1: Extract<SyncOperator, { readonly _tag: K }>,
      op2: Extract<SyncOperator, { readonly _tag: K2 }>,
    ) => SyncOperator;
  };
};

const SyncOperatorFusionMap: SyncOperatorFusionMap = {
  [SyncOperatorTag.Map]: {
    [SyncOperatorTag.Map]: (op1, op2) => Map(op1.f.compose(op2.f)),
    [SyncOperatorTag.Filter]: (op1, op2) =>
      FilterMap((a) => {
        const b = op1.f(a);
        return op2.f(b) ? Just(b) : Nothing();
      }),
    [SyncOperatorTag.FilterMap]: (op1, op2) => FilterMap(op1.f.compose(op2.f)),
  },
  [SyncOperatorTag.Filter]: {
    [SyncOperatorTag.Map]: (op1, op2) => FilterMap((a) => (op1.f(a) ? Just(op2.f(a)) : Nothing())),
    [SyncOperatorTag.Filter]: (op1, op2) => Filter(op1.f && op2.f),
    [SyncOperatorTag.FilterMap]: (op1, op2) => FilterMap((a) => (op1.f(a) ? op2.f(a) : Nothing())),
  },
  [SyncOperatorTag.FilterMap]: {
    [SyncOperatorTag.Map]: (op1, op2) => FilterMap((a) => op1.f(a).map(op2.f)),
    [SyncOperatorTag.Filter]: (op1, op2) => FilterMap((a) => op1.f(a).filter(op2.f)),
    [SyncOperatorTag.FilterMap]: (op1, op2) => FilterMap((a) => op1.f(a).flatMap(op2.f)),
  },
};

/**
 * @tsplus pipeable fncts.io.Push.SyncOperator fuse
 */
export function fuse(that: SyncOperator) {
  return (self: SyncOperator) => {
    return SyncOperatorFusionMap[self._tag][that._tag](self as any, that as any);
  };
}

/**
 * @tsplus pipeable fncts.io.Push.SyncOperator match
 */
export function match<A, B, C, D, E>(cases: {
  readonly Map: (f: Map<A, B>) => C;
  readonly Filter: (f: Filter<A>) => D;
  readonly FilterMap: (f: FilterMap<A, B>) => E;
}) {
  return (self: SyncOperator<A, B>): C | D | E => {
    switch (self._tag) {
      case SyncOperatorTag.Map:
        return cases.Map(self);
      case SyncOperatorTag.Filter:
        return cases.Filter(self);
      case SyncOperatorTag.FilterMap:
        return cases.FilterMap(self);
    }
  };
}
