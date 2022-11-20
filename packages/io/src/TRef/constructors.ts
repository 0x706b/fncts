import type { TRef } from "./definition.js";

import { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { Effect } from "../STM/definition.js";
import { Entry } from "../STM/internal/Entry.js";
import { Journal } from "../STM/internal/Journal.js";
import { Versioned } from "../STM/internal/Versioned.js";
import { Atomic } from "./definition.js";

/**
 * Makes a new `TRef` that is initialized to the specified value.
 *
 * @tsplus static fncts.io.TRefOps makeNow
 */
export function makeNow<A>(a: A, __tsplusTrace?: string): STM<never, never, TRef<A>> {
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
 * @tsplus static fncts.io.TRefOps make
 */
export function make<A>(a: Lazy<A>, __tsplusTrace?: string): STM<never, never, TRef<A>> {
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
 * @tsplus static fncts.io.TRefOps unsafeMake
 */
export function unsafeMake<A>(a: A): TRef<A> {
  const value     = a;
  const versioned = new Versioned(value);
  const todo      = new AtomicReference(Journal.emptyTodoMap);
  return new Atomic(versioned, todo);
}

/**
 * Makes a new `TRef` that is initialized to the specified value.
 *
 * @tsplus static fncts.io.TRefOps makeCommit
 */
export function makeCommit<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<TRef<A>> {
  return make(a).commit;
}

/**
 * Makes a new `TRef` that is initialized to the specified value.
 */
export function makeCommitNow<A>(a: A, __tsplusTrace?: string): UIO<TRef<A>> {
  return makeNow(a).commit;
}
