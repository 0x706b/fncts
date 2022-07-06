export interface IdentityN {
  readonly [HKT.T]: Identity<HKT._A<this>>;
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
