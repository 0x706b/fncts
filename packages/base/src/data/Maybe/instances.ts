import * as P from "../../typeclass.js";
import {
  ap_,
  filter_,
  filterMap_,
  flatMap_,
  foldLeft_,
  foldRight_,
  map_,
  partition_,
  partitionMap_,
  zipWith_,
} from "./api.js";
import { just } from "./constructors.js";

export interface MaybeF extends HKT {
  readonly type: Maybe<this["A"]>;
  readonly variance: {
    readonly A: "+";
  };
}

export const Functor: P.Functor<MaybeF> = P.Functor({ map_ });

export const Apply: P.Apply<MaybeF> = P.Apply({ map_, ap_, zipWith_ });

export const Applicative: P.Applicative<MaybeF> = P.Applicative({
  map_,
  ap_,
  zipWith_,
  pure: just,
});

export const Monad: P.Monad<MaybeF> = P.Monad({
  map_,
  ap_,
  zipWith_,
  pure: just,
  flatMap_: flatMap_,
});

export const Foldable: P.Foldable<MaybeF> = P.Foldable({
  foldLeft_,
  foldRight_,
});

export const Filterable: P.Filterable<MaybeF> = P.Filterable({
  map_,
  filter_,
  filterMap_,
  partition_,
  partitionMap_,
});
