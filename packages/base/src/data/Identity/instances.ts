import * as P from "../../prelude.js";
import { ap_, map_, pure, zipWith_ } from "./api.js";

export interface IdentityF extends P.HKT {
  readonly type: Identity<this["A"]>;
}

/**
 * @tsplus static fncts.data.IdentityOps Functor
 */
export const Functor = P.Functor<IdentityF>({ map_ });

/**
 * @tsplus static fncts.data.IdentityOps Apply
 */
export const Apply = P.Apply<IdentityF>({ map_, ap_, zipWith_ });

/**
 * @tsplus static fncts.data.IdentityOps Applicative
 */
export const Applicative = P.Applicative<IdentityF>({ map_, ap_, zipWith_, pure });
