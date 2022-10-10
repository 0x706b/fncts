import type * as P from "../../typeclass.js";
import type { IdentityN } from "@fncts/base/data/Identity/definition";

import { map, pure, zip, zipWith } from "./api.js";
/**
 * @tsplus static fncts.IdentityOps Functor
 */
export const Functor = HKT.instance<P.Functor<IdentityN>>({
  map,
});
/**
 * @tsplus static fncts.IdentityOps Apply
 */
export const Apply = HKT.instance<P.Apply<IdentityN>>({
  ...Functor,
  zip,
  zipWith,
});
/**
 * @tsplus static fncts.IdentityOps Applicative
 */
export const Applicative = HKT.instance<P.Applicative<IdentityN>>({
  ...Apply,
  pure,
});
