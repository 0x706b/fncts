import type { ImmutableNonEmptyArrayF } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";
import type * as P from "@fncts/base/typeclass";

import {
  align_,
  alignWith_,
  ap_,
  cross_,
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

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Semialign
 */
export const Semialign: P.Semialign<ImmutableNonEmptyArrayF> = {
  map: map_,
  alignWith: alignWith_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Functor
 */
export const Functor: P.Functor<ImmutableNonEmptyArrayF> = {
  map: map_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps FunctorWithIndex
 */
export const FunctorWithIndex: P.FunctorWithIndex<ImmutableNonEmptyArrayF> = {
  map: map_,
  mapWithIndex: mapWithIndex_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Apply
 */
export const Apply: P.Apply<ImmutableNonEmptyArrayF> = {
  ...Functor,
  zip: cross_,
  zipWith: crossWith_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Applicative
 */
export const Applicative: P.Applicative<ImmutableNonEmptyArrayF> = {
  ...Apply,
  pure: make,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Monad
 */
export const Monad: P.Monad<ImmutableNonEmptyArrayF> = {
  ...Applicative,
  flatMap: flatMap_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Foldable
 */
export const Foldable: P.Foldable<ImmutableNonEmptyArrayF> = {
  foldLeft: foldLeft_,
  foldRight: foldRight_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps FoldableWithIndex
 */
export const FoldableWithIndex: P.FoldableWithIndex<ImmutableNonEmptyArrayF> = {
  ...Foldable,
  foldLeftWithIndex: foldLeftWithIndex_,
  foldRightWithIndex: foldRightWithIndex_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Traversable
 */
export const Traversable: P.Traversable<ImmutableNonEmptyArrayF> = {
  ...Functor,
  ...Foldable,
  traverse: traverse_,
};

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps TraversableWithIndex
 */
export const TraversableWithIndex: P.TraversableWithIndex<ImmutableNonEmptyArrayF> = {
  ...Functor,
  ...FunctorWithIndex,
  ...FoldableWithIndex,
  ...Traversable,
  traverseWithIndex: traverseWithIndex_,
};
