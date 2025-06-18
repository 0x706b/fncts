import type { ReadonlyArrayF } from "@fncts/base/collection/immutable/ReadonlyArray/definition";
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
} from "@fncts/base/collection/immutable/ReadonlyArray/api";
import { empty } from "@fncts/base/collection/immutable/ReadonlyArray/constructors";

/**
 * @tsplus implicit
 */
export const Align = HKT.instance<P.Align<ReadonlyArrayF>>({
  map,
  alignWith,
  nil: empty,
});
/**
 * @tsplus implicit
 */
export const Functor = HKT.instance<P.Functor<ReadonlyArrayF>>({
  map,
});
/**
 * @tsplus implicit
 */
export const FunctorWithIndex = HKT.instance<P.FunctorWithIndex<ReadonlyArrayF>>({
  map,
  mapWithIndex,
});
/**
 * @tsplus implicit
 */
export const Apply = HKT.instance<P.Apply<ReadonlyArrayF>>({
  map,
  zip: cross,
  zipWith: crossWith,
});
/**
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<ReadonlyArrayF>>({
  map,
  zip: cross,
  zipWith: crossWith,
  pure: (a) => [a],
});
/**
 * @tsplus implicit
 */
export const Alt = HKT.instance<P.Alt<ReadonlyArrayF>>({
  map,
  alt,
});
/**
 * @tsplus implicit
 */
export const Alternative = HKT.instance<P.Alternative<ReadonlyArrayF>>({
  map,
  zip: cross,
  zipWith: crossWith,
  pure: (a) => [a],
  alt,
  nil: empty,
});
/**
 * @tsplus implicit
 */
export const Filterable = HKT.instance<P.Filterable<ReadonlyArrayF>>({
  map,
  filter: filter,
  filterMap: filterMap,
  partition: partition,
  partitionMap: partitionMap,
});
/**
 * @tsplus implicit
 */
export const FilterableWithIndex = HKT.instance<P.FilterableWithIndex<ReadonlyArrayF>>({
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
export const Foldable = HKT.instance<P.Foldable<ReadonlyArrayF>>({
  foldLeft,
  foldRight,
});
/**
 * @tsplus implicit
 */
export const FoldableWithIndex = HKT.instance<P.FoldableWithIndex<ReadonlyArrayF>>({
  ...Foldable,
  foldLeftWithIndex,
  foldRightWithIndex,
});
/**
 * @tsplus implicit
 */
export const FlatMap = HKT.instance<P.FlatMap<ReadonlyArrayF>>({
  ...Functor,
  flatMap,
});
/**
 * @tsplus implicit
 */
export const Monad = HKT.instance<P.Monad<ReadonlyArrayF>>({
  ...Applicative,
  ...FlatMap,
});
/**
 * @tsplus implicit
 */
export const Traversable = HKT.instance<P.Traversable<ReadonlyArrayF>>({
  ...Functor,
  ...Foldable,
  traverse,
});
/**
 * @tsplus implicit
 */
export const TraversableWithIndex = HKT.instance<P.TraversableWithIndex<ReadonlyArrayF>>({
  ...Traversable,
  ...FoldableWithIndex,
  ...FunctorWithIndex,
  traverseWithIndex,
});
/**
 * @tsplus implicit
 */
export const Witherable = HKT.instance<P.Witherable<ReadonlyArrayF>>({
  ...Traversable,
  ...Filterable,
  wither,
  wilt,
});
/**
 * @tsplus implicit
 */
export const WitherableWithIndex = HKT.instance<P.WitherableWithIndex<ReadonlyArrayF>>({
  ...TraversableWithIndex,
  ...FilterableWithIndex,
  ...Witherable,
  witherWithIndex,
  wiltWithIndex,
});
