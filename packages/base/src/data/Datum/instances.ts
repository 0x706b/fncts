import type { DatumF } from "./definition.js";
import type * as P from "@fncts/base/typeclass";

import { flatMap, map, repleteRight, zip, zipWith } from "@fncts/base/data/Datum/api";

/**
 * @tsplus implicit
 */
export const Functor: P.Functor<DatumF> = { map };

/**
 * @tsplus implicit
 */
export const Semimonoidal: P.Semimonoidal<DatumF> = { zip };

/**
 * @tsplus implicit
 */
export const Apply: P.Apply<DatumF> = { map, zip, zipWith };

/**
 * @tsplus implicit
 */
export const Applicative: P.Applicative<DatumF> = { map, zip, zipWith, pure: repleteRight };

/**
 * @tsplus implicit
 */
export const Monad: P.Monad<DatumF> = { map, zip, zipWith, pure: repleteRight, flatMap };
