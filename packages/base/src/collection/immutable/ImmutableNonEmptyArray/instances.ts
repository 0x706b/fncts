import type { ImmutableNonEmptyArrayF } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";

import {
  align_,
  alignWith_,
  ap_,
  crossWith_,
  flatMap_,
  foldLeft_,
  foldLeftWithIndex_,
  foldRight_,
  foldRightWithIndex_,
  map_,
  mapWithIndex_,
  traverse_,
  traverseWithIndex_,
} from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/api";
import { make } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/constructors";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Semialign
 */
export const Semialign: P.Semialign<ImmutableNonEmptyArrayF> = P.Semialign({
  map_,
  alignWith_,
  align_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Functor
 */
export const Functor: P.Functor<ImmutableNonEmptyArrayF> = P.Functor({
  map_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps FunctorWithIndex
 */
export const FunctorWithIndex: P.FunctorWithIndex<ImmutableNonEmptyArrayF> = P.FunctorWithIndex({
  map_,
  mapWithIndex_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Apply
 */
export const Apply: P.Apply<ImmutableNonEmptyArrayF> = P.Apply({
  map_,
  zipWith_: crossWith_,
  ap_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Applicative
 */
export const Applicative: P.Applicative<ImmutableNonEmptyArrayF> = P.Applicative({
  map_,
  zipWith_: crossWith_,
  ap_,
  pure: make,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Monad
 */
export const Monad: P.Monad<ImmutableNonEmptyArrayF> = P.Monad({
  map_,
  zipWith_: crossWith_,
  ap_,
  pure: make,
  flatMap_: flatMap_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Foldable
 */
export const Foldable: P.Foldable<ImmutableNonEmptyArrayF> = P.Foldable({
  foldLeft_,
  foldRight_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps FoldableWithIndex
 */
export const FoldableWithIndex: P.FoldableWithIndex<ImmutableNonEmptyArrayF> = P.FoldableWithIndex({
  foldLeft_,
  foldRight_,
  foldLeftWithIndex_,
  foldRightWithIndex_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Traversable
 */
export const Traversable: P.Traversable<ImmutableNonEmptyArrayF> = P.Traversable({
  map_,
  foldLeft_,
  foldRight_,
  traverse_,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps TraversableWithIndex
 */
export const TraversableWithIndex: P.TraversableWithIndex<ImmutableNonEmptyArrayF> = P.TraversableWithIndex({
  map_,
  foldLeft_,
  foldRight_,
  traverse_,
  mapWithIndex_,
  foldLeftWithIndex_,
  foldRightWithIndex_,
  traverseWithIndex_,
});
