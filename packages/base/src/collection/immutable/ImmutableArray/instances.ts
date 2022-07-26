import type { ImmutableArrayF } from "@fncts/base/collection/immutable/ImmutableArray/definition";
import type * as P from "@fncts/base/typeclass";

import {
  alignWith_,
  alt_,
  cross_,
  crossWith_,
  filter_,
  filterMap_,
  filterMapWithIndex_,
  filterWithIndex_,
  flatMap_,
  foldLeft_,
  foldLeftWithIndex_,
  foldRight_,
  foldRightWithIndex_,
  map_,
  mapWithIndex_,
  partition_,
  partitionMap_,
  partitionMapWithIndex_,
  partitionWithIndex_,
  traverse_,
  traverseWithIndex_,
  wilt,
  wiltWithIndex,
  wither,
  witherWithIndex,
} from "@fncts/base/collection/immutable/ImmutableArray/api";
import { empty } from "@fncts/base/collection/immutable/ImmutableArray/constructors";

/**
 * @tsplus implicit
 */
export const Align = HKT.instance<P.Align<ImmutableArrayF>>({
  map: map_,
  alignWith: alignWith_,
  nil: empty,
});

/**
 * @tsplus implicit
 */
export const Functor = HKT.instance<P.Functor<ImmutableArrayF>>({
  map: map_,
});

/**
 * @tsplus implicit
 */
export const FunctorWithIndex = HKT.instance<P.FunctorWithIndex<ImmutableArrayF>>({
  map: map_,
  mapWithIndex: mapWithIndex_,
});

/**
 * @tsplus implicit
 */
export const Apply = HKT.instance<P.Apply<ImmutableArrayF>>({
  map: map_,
  zip: cross_,
  zipWith: crossWith_,
});

/**
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<ImmutableArrayF>>({
  map: map_,
  zip: cross_,
  zipWith: crossWith_,
  pure: (a) => ImmutableArray(a),
});

/**
 * @tsplus implicit
 */
export const Alt = HKT.instance<P.Alt<ImmutableArrayF>>({
  map: map_,
  alt: alt_,
});

/**
 * @tsplus implicit
 */
export const Alternative = HKT.instance<P.Alternative<ImmutableArrayF>>({
  map: map_,
  zip: cross_,
  zipWith: crossWith_,
  pure: (a) => ImmutableArray(a),
  alt: alt_,
  nil: empty,
});

/**
 * @tsplus implicit
 */
export const Filterable = HKT.instance<P.Filterable<ImmutableArrayF>>({
  map: map_,
  filter: filter_,
  filterMap: filterMap_,
  partition: partition_,
  partitionMap: partitionMap_,
});

/**
 * @tsplus implicit
 */
export const FilterableWithIndex = HKT.instance<P.FilterableWithIndex<ImmutableArrayF>>({
  ...FunctorWithIndex,
  ...Filterable,
  filterWithIndex: filterWithIndex_,
  filterMapWithIndex: filterMapWithIndex_,
  partitionWithIndex: partitionWithIndex_,
  partitionMapWithIndex: partitionMapWithIndex_,
});

/**
 * @tsplus implicit
 */
export const Foldable = HKT.instance<P.Foldable<ImmutableArrayF>>({
  foldLeft: foldLeft_,
  foldRight: foldRight_,
});

/**
 * @tsplus implicit
 */
export const FoldableWithIndex = HKT.instance<P.FoldableWithIndex<ImmutableArrayF>>({
  ...Foldable,
  foldLeftWithIndex: foldLeftWithIndex_,
  foldRightWithIndex: foldRightWithIndex_,
});

/**
 * @tsplus implicit
 */
export const FlatMap = HKT.instance<P.FlatMap<ImmutableArrayF>>({
  ...Functor,
  flatMap: flatMap_,
});

/**
 * @tsplus implicit
 */
export const Monad = HKT.instance<P.Monad<ImmutableArrayF>>({
  ...Applicative,
  ...FlatMap,
});

/**
 * @tsplus implicit
 */
export const Traversable = HKT.instance<P.Traversable<ImmutableArrayF>>({
  ...Functor,
  ...Foldable,
  traverse: traverse_,
});

/**
 * @tsplus implicit
 */
export const TraversableWithIndex = HKT.instance<P.TraversableWithIndex<ImmutableArrayF>>({
  ...Traversable,
  ...FoldableWithIndex,
  ...FunctorWithIndex,
  traverseWithIndex: traverseWithIndex_,
});

/**
 * @tsplus implicit
 */
export const Witherable = HKT.instance<P.Witherable<ImmutableArrayF>>({
  ...Traversable,
  ...Filterable,
  wither,
  wilt,
});

/**
 * @tsplus implicit
 */
export const WitherableWithIndex = HKT.instance<P.WitherableWithIndex<ImmutableArrayF>>({
  ...TraversableWithIndex,
  ...FilterableWithIndex,
  ...Witherable,
  witherWithIndex,
  wiltWithIndex,
});
