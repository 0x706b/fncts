import type * as P from "../../typeclass.js";
import type { IdentityN } from "@fncts/base/data/Identity/definition";

import { ap_, map_, pure, zip_, zipWith_ } from "./api.js";

/**
 * @tsplus static fncts.IdentityOps Functor
 */
export const Functor: P.Functor<IdentityN> = {
  map: map_,
};

/**
 * @tsplus static fncts.IdentityOps Apply
 */
export const Apply: P.Apply<IdentityN> = {
  ...Functor,
  zip: zip_,
  zipWith: zipWith_,
};

/**
 * @tsplus static fncts.IdentityOps Applicative
 */
export const Applicative: P.Applicative<IdentityN> = {
  ...Apply,
  pure,
};
