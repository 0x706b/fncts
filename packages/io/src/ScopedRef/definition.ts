export const ScopedRefTypeId = Symbol.for("fncts.base.control.ScopedRef");
export type ScopedRefTypeId = typeof ScopedRefTypeId;

/**
 * @tsplus type fncts.io.ScopedRef
 * @tsplus companion fncts.io.ScopedRefOps
 */
export abstract class ScopedRef<A> {
  readonly _typeId: ScopedRefTypeId = ScopedRefTypeId;

  abstract set<R, E>(acquire: IO<R & Has<Scope>, E, A>, __tsplusTrace?: string): IO<R, E, void>;
  abstract get: UIO<A>;
}
