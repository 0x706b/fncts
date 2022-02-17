import type { NonEmptyArrayF } from "./definition";

import * as P from "../../../prelude";
import {
  align_,
  alignWith_,
  ap_,
  chain_,
  crossWith_,
  foldLeft_,
  foldLeftWithIndex_,
  foldRight_,
  foldRightWithIndex_,
  map_,
  mapWithIndex_,
  traverse_,
  traverseWithIndex_,
  zipWith_,
} from "./api";
import { make } from "./constructors";

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps Semialign
 */
export const Semialign: P.Semialign<NonEmptyArrayF> = P.Semialign({
  map_,
  alignWith_,
  align_,
});

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps Functor
 */
export const Functor: P.Functor<NonEmptyArrayF> = P.Functor({
  map_,
});

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps FunctorWithIndex
 */
export const FunctorWithIndex: P.FunctorWithIndex<NonEmptyArrayF> =
  P.FunctorWithIndex({
    map_,
    mapWithIndex_,
  });

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps Apply
 */
export const Apply: P.Apply<NonEmptyArrayF> = P.Apply({
  map_,
  zipWith_: crossWith_,
  ap_,
});

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps Applicative
 */
export const Applicative: P.Applicative<NonEmptyArrayF> = P.Applicative({
  map_,
  zipWith_: crossWith_,
  ap_,
  pure: make,
});

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps Monad
 */
export const Monad: P.Monad<NonEmptyArrayF> = P.Monad({
  map_,
  zipWith_: crossWith_,
  ap_,
  pure: make,
  chain_,
});

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps Foldable
 */
export const Foldable: P.Foldable<NonEmptyArrayF> = P.Foldable({
  foldLeft_,
  foldRight_,
});

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps FoldableWithIndex
 */
export const FoldableWithIndex: P.FoldableWithIndex<NonEmptyArrayF> =
  P.FoldableWithIndex({
    foldLeft_,
    foldRight_,
    foldLeftWithIndex_,
    foldRightWithIndex_,
  });

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps Traversable
 */
export const Traversable: P.Traversable<NonEmptyArrayF> = P.Traversable({
  map_,
  foldLeft_,
  foldRight_,
  traverse_,
});

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps TraversableWithIndex
 */
export const TraversableWithIndex: P.TraversableWithIndex<NonEmptyArrayF> =
  P.TraversableWithIndex({
    map_,
    foldLeft_,
    foldRight_,
    traverse_,
    mapWithIndex_,
    foldLeftWithIndex_,
    foldRightWithIndex_,
    traverseWithIndex_,
  });
