export const ScopedRefTypeId = Symbol.for("fncts.io.ScopedRef");
export type ScopedRefTypeId = typeof ScopedRefTypeId;

/**
 * @tsplus type fncts.io.ScopedRef
 * @tsplus companion fncts.io.ScopedRefOps
 */
export abstract class ScopedRef<A> {
  readonly [ScopedRefTypeId]: ScopedRefTypeId = ScopedRefTypeId;
  abstract set<R, E>(acquire: IO<R | Scope, E, A>, __tsplusTrace?: string): IO<Exclude<R, Scope>, E, void>;
  abstract get: UIO<A>;
}
