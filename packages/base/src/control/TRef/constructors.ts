import type { Lazy } from "../../data/function.js";
import type { UIO } from "../IO.js";
import type { STM } from "../STM/definition.js";
import type { UTRef } from "./definition.js";

import { AtomicReference } from "../../internal/AtomicReference.js";
import { Effect } from "../STM/definition.js";
import { Entry } from "../STM/internal/Entry.js";
import { Journal } from "../STM/internal/Journal.js";
import { Versioned } from "../STM/internal/Versioned.js";
import { Atomic } from "./definition.js";

/**
 * Makes a new `TRef` that is initialized to the specified value.
 *
 * @tsplus static fncts.control.TRefOps makeNow
 */
export function makeNow<A>(a: A): STM<unknown, never, UTRef<A>> {
  return new Effect((journal) => {
    const value     = a;
    const versioned = new Versioned(value);
    const todo      = new AtomicReference(Journal.emptyTodoMap);
    const tref      = new Atomic(versioned, todo);
    journal.set(tref, Entry.make(tref, true));
    return tref;
  });
}

/**
 * Makes a new `TRef` that is initialized to the specified value.
 *
 * @tsplus static fncts.control.TRefOps make
 */
export function make<A>(a: Lazy<A>): STM<unknown, never, UTRef<A>> {
  return new Effect((journal) => {
    const value     = a();
    const versioned = new Versioned(value);
    const todo      = new AtomicReference(Journal.emptyTodoMap);
    const tref      = new Atomic(versioned, todo);
    journal.set(tref, Entry.make(tref, true));
    return tref;
  });
}

/**
 * Unsafely makes a new `TRef` that is initialized to the specified value.
 *
 * @tsplus static fncts.control.TRefOps unsafeMake
 */
export function unsafeMake<A>(a: A): UTRef<A> {
  const value     = a;
  const versioned = new Versioned(value);
  const todo      = new AtomicReference(Journal.emptyTodoMap);
  return new Atomic(versioned, todo);
}

/**
 * Makes a new `TRef` that is initialized to the specified value.
 *
 * @tsplus static fncts.control.TRefOps makeCommit
 */
export function makeCommit<A>(a: Lazy<A>): UIO<UTRef<A>> {
  return make(a).commit;
}

/**
 * Makes a new `TRef` that is initialized to the specified value.
 */
export function makeCommitNow<A>(a: A): UIO<UTRef<A>> {
  return makeNow(a).commit;
}
