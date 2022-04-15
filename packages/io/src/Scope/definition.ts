export const ScopeTypeId = Symbol.for("fncts.base.control.Scope");
export type ScopeTypeId = typeof ScopeTypeId;

/**
 * @tsplus type fncts.control.Scope
 * @tsplus companion fncts.control.ScopeOps
 */
export abstract class Scope {
  readonly _typeId: ScopeTypeId = ScopeTypeId;
  abstract addFinalizerExit(finalizer: Finalizer): UIO<void>;
  abstract fork: UIO<Scope.Closeable>;
}

/**
 * @tsplus type fncts.control.Scope.Closeable
 * @tsplus companion fncts.control.Scope.CloseableOps
 */
export abstract class Closeable extends Scope {
  abstract close(exit: Lazy<Exit<any, any>>): UIO<void>;
}

type Closeable_ = Closeable;

export declare namespace Scope {
  type Closeable = Closeable_;
}

/**
 * @tsplus static fncts.control.ScopeOps Tag
 */
export const ScopeTag = Tag<Scope>();
