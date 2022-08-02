import type { UTRef } from "./definition.js";

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
export function makeNow<A>(a: A): STM<never, never, UTRef<A>> {
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
export function make<A>(a: Lazy<A>): STM<never, never, UTRef<A>> {
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
export function unsafeMake<A>(a: A): UTRef<A> {
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
export function makeCommit<A>(a: Lazy<A>): UIO<UTRef<A>> {
  return make(a).commit;
}

/**
 * Makes a new `TRef` that is initialized to the specified value.
 */
export function makeCommitNow<A>(a: A): UIO<UTRef<A>> {
  return makeNow(a).commit;
}
