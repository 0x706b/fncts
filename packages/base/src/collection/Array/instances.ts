import type { ArrayF } from "./definition.js";

import * as P from "../../prelude.js";
import { empty } from "./constructors.js";
import {
  alignWith_,
  alt_,
  ap_,
  chain_,
  crossWith_,
  filter_,
  filterMap_,
  filterMapWithIndex_,
  filterWithIndex_,
  flatten,
  foldLeft_,
  foldLeftWithIndex_,
  foldMap_,
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
} from "./immutable-api.js";

export const Align = P.Align<ArrayF>({
  map_,
  alignWith_,
  nil: empty,
});

export const Functor = P.Functor<ArrayF>({
  map_,
});

export const FunctorWithIndex = P.FunctorWithIndex<ArrayF>({
  map_,
  mapWithIndex_,
});

export const Apply = P.Apply<ArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
});

export const Applicative = P.Applicative<ArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: (a) => [a],
});

export const Alt = P.Alt<ArrayF>({
  map_,
  alt_,
});

export const Alternative = P.Alternative<ArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: (a) => [a],
  alt_,
  nil: empty,
});

export const Filterable = P.Filterable<ArrayF>({
  map_,
  filter_,
  filterMap_,
  partition_,
  partitionMap_,
});

export const FilterableWithIndex = P.FilterableWithIndex<ArrayF>({
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

export const Foldable = P.Foldable<ArrayF>({
  foldLeft_,
  foldRight_,
});

export const FoldableWithIndex = P.FoldableWithIndex<ArrayF>({
  foldLeft_,
  foldRight_,
  foldLeftWithIndex_,
  foldRightWithIndex_,
});

export const Monad = P.Monad<ArrayF>({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: (a) => [a],
  chain_,
});

export const Traversable = P.Traversable<ArrayF>({
  map_,
  foldLeft_,
  foldRight_,
  traverse_,
});

export const TraversableWithIndex = P.TraversableWithIndex<ArrayF>({
  map_,
  foldLeft_,
  foldRight_,
  traverse_,
  mapWithIndex_,
  foldLeftWithIndex_,
  foldRightWithIndex_,
  traverseWithIndex_,
});

export const Witherable = P.Witherable<ArrayF>({
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

export const WitherableWithIndex = P.WitherableWithIndex<ArrayF>({
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
