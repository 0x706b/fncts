export const ScopeTypeId = Symbol.for("fncts.base.control.Scope");
export type ScopeTypeId = typeof ScopeTypeId;

/**
 * @tsplus type fncts.io.Scope
 * @tsplus companion fncts.io.ScopeOps
 */
export abstract class Scope {
  readonly _typeId: ScopeTypeId = ScopeTypeId;
  abstract addFinalizerExit(finalizer: Finalizer): UIO<void>;
  abstract fork: UIO<Scope.Closeable>;
}

/**
 * @tsplus type fncts.io.Scope.Closeable
 * @tsplus companion fncts.io.Scope.CloseableOps
 */
export abstract class Closeable extends Scope {
  abstract close(exit: Lazy<Exit<any, any>>): UIO<void>;
}

type Closeable_ = Closeable;

export declare namespace Scope {
  type Closeable = Closeable_;
}

/**
 * @tsplus static fncts.io.ScopeOps Tag
 */
export const ScopeTag = Tag<Scope>();
