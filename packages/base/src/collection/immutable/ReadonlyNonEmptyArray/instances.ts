import type { ReadonlyNonEmptyArrayF } from "@fncts/base/collection/immutable/ReadonlyNonEmptyArray/definition";
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
} from "@fncts/base/collection/immutable/ReadonlyNonEmptyArray/api";
import { make } from "@fncts/base/collection/immutable/ReadonlyNonEmptyArray/constructors";

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps Semialign
 */
export const Semialign = HKT.instance<P.Semialign<ReadonlyNonEmptyArrayF>>({
  map,
  alignWith,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps Functor
 */
export const Functor = HKT.instance<P.Functor<ReadonlyNonEmptyArrayF>>({
  map,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps FunctorWithIndex
 */
export const FunctorWithIndex = HKT.instance<P.FunctorWithIndex<ReadonlyNonEmptyArrayF>>({
  map,
  mapWithIndex,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps Apply
 */
export const Apply = HKT.instance<P.Apply<ReadonlyNonEmptyArrayF>>({
  ...Functor,
  zip: cross,
  zipWith: crossWith,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps Applicative
 */
export const Applicative = HKT.instance<P.Applicative<ReadonlyNonEmptyArrayF>>({
  ...Apply,
  pure: make,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps Monad
 */
export const Monad = HKT.instance<P.Monad<ReadonlyNonEmptyArrayF>>({
  ...Applicative,
  flatMap,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps Foldable
 */
export const Foldable = HKT.instance<P.Foldable<ReadonlyNonEmptyArrayF>>({
  foldLeft,
  foldRight,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps FoldableWithIndex
 */
export const FoldableWithIndex = HKT.instance<P.FoldableWithIndex<ReadonlyNonEmptyArrayF>>({
  ...Foldable,
  foldLeftWithIndex,
  foldRightWithIndex,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps Traversable
 */
export const Traversable = HKT.instance<P.Traversable<ReadonlyNonEmptyArrayF>>({
  ...Functor,
  ...Foldable,
  traverse: traverse,
});

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps TraversableWithIndex
 */
export const TraversableWithIndex = HKT.instance<P.TraversableWithIndex<ReadonlyNonEmptyArrayF>>({
  ...Functor,
  ...FunctorWithIndex,
  ...FoldableWithIndex,
  ...Traversable,
  traverseWithIndex: traverseWithIndex,
});
