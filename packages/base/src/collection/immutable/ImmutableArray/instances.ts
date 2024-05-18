import type { ImmutableArrayF } from "@fncts/base/collection/immutable/ImmutableArray/definition";
import type * as P from "@fncts/base/typeclass";

import {
  alignWith,
  alt,
  cross,
  crossWith,
  filter,
  filterMap,
  filterMapWithIndex,
  filterWithIndex,
  flatMap,
  foldLeft,
  foldLeftWithIndex,
  foldRight,
  foldRightWithIndex,
  map,
  mapWithIndex,
  partition,
  partitionMap,
  partitionMapWithIndex,
  partitionWithIndex,
  traverse,
  traverseWithIndex,
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
  map,
  alignWith,
  nil: empty,
});
/**
 * @tsplus implicit
 */
export const Functor = HKT.instance<P.Functor<ImmutableArrayF>>({
  map,
});
/**
 * @tsplus implicit
 */
export const FunctorWithIndex = HKT.instance<P.FunctorWithIndex<ImmutableArrayF>>({
  map,
  mapWithIndex,
});
/**
 * @tsplus implicit
 */
export const Apply = HKT.instance<P.Apply<ImmutableArrayF>>({
  map,
  zip: cross,
  zipWith: crossWith,
});
/**
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<ImmutableArrayF>>({
  map,
  zip: cross,
  zipWith: crossWith,
  pure: (a) => ImmutableArray(a),
});
/**
 * @tsplus implicit
 */
export const Alt = HKT.instance<P.Alt<ImmutableArrayF>>({
  map,
  alt,
});
/**
 * @tsplus implicit
 */
export const Alternative = HKT.instance<P.Alternative<ImmutableArrayF>>({
  map,
  zip: cross,
  zipWith: crossWith,
  pure: (a) => ImmutableArray(a),
  alt,
  nil: empty,
});
/**
 * @tsplus implicit
 */
export const Filterable = HKT.instance<P.Filterable<ImmutableArrayF>>({
  map,
  filter: filter,
  filterMap: filterMap,
  partition: partition,
  partitionMap: partitionMap,
});
/**
 * @tsplus implicit
 */
export const FilterableWithIndex = HKT.instance<P.FilterableWithIndex<ImmutableArrayF>>({
  ...FunctorWithIndex,
  ...Filterable,
  filterWithIndex: filterWithIndex,
  filterMapWithIndex: filterMapWithIndex,
  partitionWithIndex: partitionWithIndex,
  partitionMapWithIndex: partitionMapWithIndex,
});
/**
 * @tsplus implicit
 */
export const Foldable = HKT.instance<P.Foldable<ImmutableArrayF>>({
  foldLeft,
  foldRight,
});
/**
 * @tsplus implicit
 */
export const FoldableWithIndex = HKT.instance<P.FoldableWithIndex<ImmutableArrayF>>({
  ...Foldable,
  foldLeftWithIndex,
  foldRightWithIndex,
});
/**
 * @tsplus implicit
 */
export const FlatMap = HKT.instance<P.FlatMap<ImmutableArrayF>>({
  ...Functor,
  flatMap,
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
  traverse,
});
/**
 * @tsplus implicit
 */
export const TraversableWithIndex = HKT.instance<P.TraversableWithIndex<ImmutableArrayF>>({
  ...Traversable,
  ...FoldableWithIndex,
  ...FunctorWithIndex,
  traverseWithIndex,
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
