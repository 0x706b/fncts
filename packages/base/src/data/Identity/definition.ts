export interface IdentityN extends HKT {
  type: Identity<this["A"]>;
}

/**
 * @tsplus type fncts.Identity
 */
export interface Identity<A> extends Newtype<"Identity", A> {}

/**
 * @tsplus type fncts.IdentityOps
 */
export interface IdentityOps extends NewtypeIso<IdentityN> {}

export const Identity: IdentityOps = Newtype<IdentityN>();
