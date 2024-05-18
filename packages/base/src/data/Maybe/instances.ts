import type * as P from "../../typeclass.js";
import type { MaybeF } from "@fncts/base/data/Maybe/definition";

import { filter, filterMap, flatMap, foldLeft, foldRight, map, partition, partitionMap, zip, zipWith } from "./api.js";
import { just } from "./constructors.js";

/**
 * @tsplus static fncts.MaybeOps Functor
 */
export const Functor = HKT.instance<P.Functor<MaybeF>>({ map });

/**
 * @tsplus static fncts.MaybeOps Apply
 */
export const Apply = HKT.instance<P.Apply<MaybeF>>({ ...Functor, zip, zipWith });

/**
 * @tsplus static fncts.MaybeOps Applicative
 */
export const Applicative = HKT.instance<P.Applicative<MaybeF>>({
  ...Apply,
  pure: just,
});

/**
 * @tsplus static fncts.MaybeOps Monad
 */
export const Monad = HKT.instance<P.Monad<MaybeF>>({
  ...Applicative,
  flatMap,
});

/**
 * @tsplus static fncts.MaybeOps Foldable
 */
export const Foldable = HKT.instance<P.Foldable<MaybeF>>({
  foldLeft,
  foldRight,
});

/**
 * @tsplus static fncts.MaybeOps Filterable
 */
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
