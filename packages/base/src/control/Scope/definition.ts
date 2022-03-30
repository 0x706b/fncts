import type { Exit } from "../../data/Exit.js";
import type { Lazy } from "../../data/function.js";
import type { UIO } from "../IO.js";
import type { Finalizer } from "./Finalizer.js";

import { Tag } from "../../data/Tag.js";

export const ScopeTypeId = Symbol.for("fncts.base.control.Scope");
export type ScopeTypeId = typeof ScopeTypeId;

/**
 * @tsplus type fncts.control.Scope
 * @tsplus companion fncts.control.ScopeOps
 */
export abstract class Scope {
  readonly _typeId: ScopeTypeId = ScopeTypeId;
  abstract addFinalizerExit(finalizer: Finalizer): UIO<void>;
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

const ScopeKey = Symbol.for("fncts.base.control.Scope.Key");

/**
 * @tsplus static fncts.control.ScopeOps Tag
 */
export const ScopeTag = Tag<Scope>(ScopeKey);