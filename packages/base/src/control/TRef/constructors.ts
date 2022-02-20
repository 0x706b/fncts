import type { Lazy } from "../../data/function";
import type { UIO } from "../IO";
import type { STM } from "../STM/definition";
import type { UTRef } from "./definition";

import { AtomicReference } from "../../internal/AtomicReference";
import { Entry } from "../../internal/Entry";
import { Journal } from "../../internal/Journal";
import { Versioned } from "../../internal/Versioned";
import { Effect } from "../STM/definition";
import { Atomic } from "./definition";

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
