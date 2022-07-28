import type { DatumF } from "./definition.js";
import type * as P from "@fncts/base/typeclass";

import { flatMap, map, replete, zip, zipWith } from "@fncts/base/data/Datum/api";

/**
 * @tsplus static fncts.DatumOps Functor
 * @tsplus implicit
 */
export const Functor = HKT.instance<P.Functor<DatumF>>({ map });

/**
 * @tsplus static fncts.DatumOps Semimonoidal
 * @tsplus implicit
 */
export const Semimonoidal = HKT.instance<P.Semimonoidal<DatumF>>({ zip });

/**
 * @tsplus static fncts.DatumOps Apply
 * @tsplus implicit
 */
export const Apply = HKT.instance<P.Apply<DatumF>>({ map, zip, zipWith });

/**
 * @tsplus static fncts.DatumOps Applicative
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<DatumF>>({ map, zip, zipWith, pure: replete });

/**
 * @tsplus static fncts.DatumOps Monad
 * @tsplus implicit
 */
export const Monad = HKT.instance<P.Monad<DatumF>>({ map, zip, zipWith, pure: replete, flatMap });
