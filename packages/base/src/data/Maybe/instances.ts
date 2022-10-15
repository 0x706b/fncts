import type * as P from "../../typeclass.js";
import type { MaybeF } from "@fncts/base/data/Maybe/definition";

import { MaybeJson } from "@fncts/base/json/MaybeJson";

import { filter, filterMap, flatMap, foldLeft, foldRight, map, partition, partitionMap, zip, zipWith } from "./api.js";
import { just } from "./constructors.js";

export const Functor = HKT.instance<P.Functor<MaybeF>>({ map });

export const Apply = HKT.instance<P.Apply<MaybeF>>({ ...Functor, zip, zipWith });

export const Applicative = HKT.instance<P.Applicative<MaybeF>>({
  ...Apply,
  pure: just,
});

export const Monad = HKT.instance<P.Monad<MaybeF>>({
  ...Applicative,
  flatMap,
});

export const Foldable = HKT.instance<P.Foldable<MaybeF>>({
  foldLeft,
  foldRight,
});

export const Filterable = HKT.instance<P.Filterable<MaybeF>>({
  ...Functor,
  filter,
  filterMap,
  partition,
  partitionMap,
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

/**
 * @tsplus derive fncts.Encoder[fncts.Maybe]<_> 10
 */
export function deriveEncoder<A extends Maybe<any>>(
  ...[value]: [A] extends [Maybe<infer A>] ? [value: Encoder<A>] : never
): Encoder<A> {
  return Encoder((input) => {
    Maybe.concrete(input);
    if (input.isJust()) {
      return {
        _tag: "Just",
        value: value.encode(input.value),
      };
    } else {
      return {
        _tag: "Nothing",
      };
    }
  });
}
