import type { ImmutableNonEmptyArrayF } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";
import type * as P from "@fncts/base/typeclass";

import {
  alignWith,
  cross,
  crossWith,
  flatMap,
  foldLeft,
  foldLeftWithIndex,
  foldRight,
  foldRightWithIndex,
  map,
  mapWithIndex,
  traverse,
  traverseWithIndex,
} from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/api";
import { make } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/constructors";

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Semialign
 */
export const Semialign = HKT.instance<P.Semialign<ImmutableNonEmptyArrayF>>({
  map,
  alignWith,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Functor
 */
export const Functor = HKT.instance<P.Functor<ImmutableNonEmptyArrayF>>({
  map,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps FunctorWithIndex
 */
export const FunctorWithIndex = HKT.instance<P.FunctorWithIndex<ImmutableNonEmptyArrayF>>({
  map,
  mapWithIndex,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Apply
 */
export const Apply = HKT.instance<P.Apply<ImmutableNonEmptyArrayF>>({
  ...Functor,
  zip: cross,
  zipWith: crossWith,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Applicative
 */
export const Applicative = HKT.instance<P.Applicative<ImmutableNonEmptyArrayF>>({
  ...Apply,
  pure: make,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Monad
 */
export const Monad = HKT.instance<P.Monad<ImmutableNonEmptyArrayF>>({
  ...Applicative,
  flatMap,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Foldable
 */
export const Foldable = HKT.instance<P.Foldable<ImmutableNonEmptyArrayF>>({
  foldLeft,
  foldRight,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps FoldableWithIndex
 */
export const FoldableWithIndex = HKT.instance<P.FoldableWithIndex<ImmutableNonEmptyArrayF>>({
  ...Foldable,
  foldLeftWithIndex,
  foldRightWithIndex,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps Traversable
 */
export const Traversable = HKT.instance<P.Traversable<ImmutableNonEmptyArrayF>>({
  ...Functor,
  ...Foldable,
  traverse: traverse,
});

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps TraversableWithIndex
 */
export const TraversableWithIndex = HKT.instance<P.TraversableWithIndex<ImmutableNonEmptyArrayF>>({
  ...Functor,
  ...FunctorWithIndex,
  ...FoldableWithIndex,
  ...Traversable,
  traverseWithIndex: traverseWithIndex,
});
