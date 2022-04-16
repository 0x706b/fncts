import type { ImmutableArrayF } from "@fncts/base/collection/immutable/ImmutableArray/definition";

import {
  alignWith_,
  alt_,
  ap_,
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
import * as P from "@fncts/base/typeclass";

export const Align = P.Align<ImmutableArrayF>({
  map_,
  alignWith_,
  nil: empty,
});

export const Functor = P.Functor<ImmutableArrayF>({
  map_,
});

export const FunctorWithIndex = P.FunctorWithIndex<ImmutableArrayF>({
  map_,
  mapWithIndex_,
});

export const Apply = P.Apply<ImmutableArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
});

export const Applicative = P.Applicative<ImmutableArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: (a) => ImmutableArray(a),
});

export const Alt = P.Alt<ImmutableArrayF>({
  map_,
  alt_,
});

export const Alternative = P.Alternative<ImmutableArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: (a) => ImmutableArray(a),
  alt_,
  nil: empty,
});

export const Filterable = P.Filterable<ImmutableArrayF>({
  map_,
  filter_,
  filterMap_,
  partition_,
  partitionMap_,
});

export const FilterableWithIndex = P.FilterableWithIndex<ImmutableArrayF>({
  map_,
  filter_,
  filterMap_,
  partition_,
  partitionMap_,
  mapWithIndex_,
  filterWithIndex_,
  filterMapWithIndex_,
  partitionWithIndex_,
  partitionMapWithIndex_,
});

export const Foldable = P.Foldable<ImmutableArrayF>({
  foldLeft_,
  foldRight_,
});

export const FoldableWithIndex = P.FoldableWithIndex<ImmutableArrayF>({
  foldLeft_,
  foldRight_,
  foldLeftWithIndex_,
  foldRightWithIndex_,
});

export const Monad = P.Monad<ImmutableArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: (a) => ImmutableArray(a),
  flatMap_: flatMap_,
});

export const Traversable = P.Traversable<ImmutableArrayF>({
  map_,
  foldLeft_,
  foldRight_,
  traverse_,
});

export const TraversableWithIndex = P.TraversableWithIndex<ImmutableArrayF>({
  map_,
  foldLeft_,
  foldRight_,
  traverse_,
  mapWithIndex_,
  foldLeftWithIndex_,
  foldRightWithIndex_,
  traverseWithIndex_,
});

export const Witherable = P.Witherable<ImmutableArrayF>({
  map_,
  foldLeft_,
  foldRight_,
  filter_,
  filterMap_,
  partition_,
  partitionMap_,
  traverse_,
  wither_,
  wilt_,
});

export const WitherableWithIndex = P.WitherableWithIndex<ImmutableArrayF>({
  map_,
  foldLeft_,
  foldRight_,
  filter_,
  filterMap_,
  partition_,
  partitionMap_,
  traverse_,
  wither_,
  wilt_,
  mapWithIndex_,
  foldLeftWithIndex_,
  foldRightWithIndex_,
  filterWithIndex_,
  filterMapWithIndex_,
  partitionWithIndex_,
  partitionMapWithIndex_,
  traverseWithIndex_,
  witherWithIndex_,
  wiltWithIndex_,
});
