import type * as P from "../../typeclass.js";
import type { MaybeF } from "@fncts/base/data/Maybe/definition";

import { MaybeJson } from "@fncts/base/json/MaybeJson";

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

export const Functor = HKT.instance<P.Functor<MaybeF>>({ map: map_ });

export const Apply = HKT.instance<P.Apply<MaybeF>>({ ...Functor, zip: zip_, zipWith: zipWith_ });

export const Applicative = HKT.instance<P.Applicative<MaybeF>>({
  ...Apply,
  pure: just,
});

export const Monad = HKT.instance<P.Monad<MaybeF>>({
  ...Applicative,
  flatMap: flatMap_,
});

export const Foldable = HKT.instance<P.Foldable<MaybeF>>({
  foldLeft: foldLeft_,
  foldRight: foldRight_,
});

export const Filterable = HKT.instance<P.Filterable<MaybeF>>({
  ...Functor,
  filter: filter_,
  filterMap: filterMap_,
  partition: partition_,
  partitionMap: partitionMap_,
});

/**
 * @tsplus derive fncts.Guard[fncts.Maybe]<_> 10
 */
export function deriveGuard<A extends Maybe<any>>(
  ...[guard]: [A] extends [Maybe<infer A>] ? [guard: Guard<A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (Maybe.isMaybe(u)) {
      if (u.isNothing()) {
        return true;
      }
      if (u.isJust()) {
        return guard.is(u.value);
      }
    }
    return false;
  });
}

/**
 * @tsplus derive fncts.Decoder[fncts.Maybe]<_> 10
 */
export function deriveDecoder<A extends Maybe<any>>(
  ...[value]: [A] extends [Maybe<infer A>] ? [value: Decoder<A>] : never
): Decoder<A> {
  const label = `Maybe<${value.label}>`;
  return Decoder(
    (input) =>
      MaybeJson.getDecoder(value)
        .decode(input)
        .map((decoded) => (decoded._tag === "Nothing" ? (Nothing() as A) : (Just(decoded.value) as A))),
    label,
  );
}
