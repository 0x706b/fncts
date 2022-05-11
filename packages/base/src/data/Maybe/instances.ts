import type * as P from "../../typeclass.js";
import type { MaybeF } from "@fncts/base/data/Maybe/definition";

import {
  filter_,
  filterMap_,
  flatMap_,
  foldLeft_,
  foldRight_,
  map_,
  partition_,
  partitionMap_,
  zip_,
  zipWith_,
} from "./api.js";
import { just } from "./constructors.js";

export const Functor: P.Functor<MaybeF> = { map: map_ };

export const Apply: P.Apply<MaybeF> = { ...Functor, zip: zip_, zipWith: zipWith_ };

export const Applicative: P.Applicative<MaybeF> = {
  ...Apply,
  pure: just,
};

export const Monad: P.Monad<MaybeF> = {
  ...Applicative,
  flatMap: flatMap_,
};

export const Foldable: P.Foldable<MaybeF> = {
  foldLeft: foldLeft_,
  foldRight: foldRight_,
};

export const Filterable: P.Filterable<MaybeF> = {
  ...Functor,
  filter: filter_,
  filterMap: filterMap_,
  partition: partition_,
  partitionMap: partitionMap_,
};
