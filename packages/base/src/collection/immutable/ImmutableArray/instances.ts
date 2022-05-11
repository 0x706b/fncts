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
  wilt_,
  wiltWithIndex_,
  wither_,
  witherWithIndex_,
} from "@fncts/base/collection/immutable/ImmutableArray/api";
import { empty } from "@fncts/base/collection/immutable/ImmutableArray/constructors";

/**
 * @tsplus implicit
 */
export const Align: P.Align<ImmutableArrayF> = {
  map: map_,
  alignWith: alignWith_,
  nil: empty,
};

/**
 * @tsplus implicit
 */
export const Functor: P.Functor<ImmutableArrayF> = {
  map: map_,
};

/**
 * @tsplus implicit
 */
export const FunctorWithIndex: P.FunctorWithIndex<ImmutableArrayF> = {
  map: map_,
  mapWithIndex: mapWithIndex_,
};

/**
 * @tsplus implicit
 */
export const Apply: P.Apply<ImmutableArrayF> = {
  map: map_,
  zip: cross_,
  zipWith: crossWith_,
};

/**
 * @tsplus implicit
 */
export const Applicative: P.Applicative<ImmutableArrayF> = {
  map: map_,
  zip: cross_,
  zipWith: crossWith_,
  pure: (a) => ImmutableArray(a),
};

/**
 * @tsplus implicit
 */
export const Alt: P.Alt<ImmutableArrayF> = {
  map: map_,
  alt: alt_,
};

/**
 * @tsplus implicit
 */
export const Alternative: P.Alternative<ImmutableArrayF> = {
  map: map_,
  zip: cross_,
  zipWith: crossWith_,
  pure: (a) => ImmutableArray(a),
  alt: alt_,
  nil: empty,
};

/**
 * @tsplus implicit
 */
export const Filterable: P.Filterable<ImmutableArrayF> = {
  map: map_,
  filter: filter_,
  filterMap: filterMap_,
  partition: partition_,
  partitionMap: partitionMap_,
};

/**
 * @tsplus implicit
 */
export const FilterableWithIndex: P.FilterableWithIndex<ImmutableArrayF> = {
  ...FunctorWithIndex,
  ...Filterable,
  filterWithIndex: filterWithIndex_,
  filterMapWithIndex: filterMapWithIndex_,
  partitionWithIndex: partitionWithIndex_,
  partitionMapWithIndex: partitionMapWithIndex_,
};

/**
 * @tsplus implicit
 */
export const Foldable: P.Foldable<ImmutableArrayF> = {
  foldLeft: foldLeft_,
  foldRight: foldRight_,
};

/**
 * @tsplus implicit
 */
export const FoldableWithIndex: P.FoldableWithIndex<ImmutableArrayF> = {
  ...Foldable,
  foldLeftWithIndex: foldLeftWithIndex_,
  foldRightWithIndex: foldRightWithIndex_,
};

/**
 * @tsplus implicit
 */
export const FlatMap: P.FlatMap<ImmutableArrayF> = {
  ...Functor,
  flatMap: flatMap_,
};

/**
 * @tsplus implicit
 */
export const Monad: P.Monad<ImmutableArrayF> = {
  ...Applicative,
  ...FlatMap,
};

/**
 * @tsplus implicit
 */
export const Traversable: P.Traversable<ImmutableArrayF> = {
  ...Functor,
  ...Foldable,
  traverse: traverse_,
};

/**
 * @tsplus implicit
 */
export const TraversableWithIndex: P.TraversableWithIndex<ImmutableArrayF> = {
  ...Traversable,
  ...FoldableWithIndex,
  ...FunctorWithIndex,
  traverseWithIndex: traverseWithIndex_,
};

/**
 * @tsplus implicit
 */
export const Witherable: P.Witherable<ImmutableArrayF> = {
  ...Traversable,
  ...Filterable,
  wither: wither_,
  wilt: wilt_,
};

/**
 * @tsplus implicit
 */
export const WitherableWithIndex: P.WitherableWithIndex<ImmutableArrayF> = {
  ...TraversableWithIndex,
  ...FilterableWithIndex,
  ...Witherable,
  witherWithIndex: witherWithIndex_,
  wiltWithIndex: wiltWithIndex_,
};
