import type { HKT } from "../../prelude";
import type { Maybe } from "./definition";

import * as P from "../../prelude";
import { ap_, chain_, filter_, filterMap_, foldLeft_, foldRight_, map_, partition_, partitionMap_, zipWith_ } from "./api";
import { just } from "./constructors";

export interface MaybeF extends HKT {
  readonly type: Maybe<this["A"]>;
  readonly variance: {
    readonly A: "-";
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
  chain_,
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
