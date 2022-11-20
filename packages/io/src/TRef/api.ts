import type { Journal } from "../STM/internal/Journal.js";
import type { PTRef } from "../TRef/definition.js";

import { concrete } from "../TRef/definition.js";

/**
 * Retrieves the value of the `TRef`.
 *
 * @tsplus getter fncts.io.TRef get
 */
export function get<EA, EB, A, B>(self: PTRef<EA, EB, A, B>, __tsplusTrace?: string): STM<never, EB, B> {
  concrete(self);
  return self.get;
}

/**
 * Updates the value of the variable, returning a function of the specified
 * value.
 *
 * @tsplus pipeable fncts.io.TRef modify
 */
export function modify<A, B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, B> => {
    concrete(self);
    return self.modify(f);
  };
}

/**
 * Sets the value of the `TRef`.
 *
 * @tsplus pipeable fncts.io.TRef set
 */
export function set<A>(a: A, __tsplusTrace?: string) {
  return <EA, EB, B>(self: PTRef<EA, EB, A, B>): STM<never, EA, void> => {
    concrete(self);
    return self.set(a);
  };
}

/**
 * Unsafely retrieves the value of the `TRef`.
 *
 * @tsplus pipeable fncts.io.TRef unsafeGet
 */
export function unsafeGet(journal: Journal, __tsplusTrace?: string) {
  return <EA, EB, A, B>(self: PTRef<EA, EB, A, B>): A => {
    concrete(self);
    return self.unsafeGet(journal);
  };
}

/**
 * Updates the value of the variable, returning a function of the specified
 * value.
 *
 * @tsplus pipeable fncts.io.TRef modifyJust
 */
export function modifyJust<A, B>(b: B, f: (a: A) => Maybe<readonly [B, A]>, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, B> => {
    return self.modify((a) => f(a).getOrElse([b, a]));
  };
}

/**
 * Sets the value of the `TRef` and returns the old value.
 *
 * @tsplus pipeable fncts.io.TRef getAndSet
 */
export function getAndSet<A>(a: A, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, A> => {
    concrete(self);
    return self.modify((oldA) => [oldA, a]);
  };
}

/**
 * Updates the value of the variable and returns the old value.
 *
 * @tsplus pipeable fncts.io.TRef getAndUpdate
 */
export function getAndUpdate<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, A> => {
    concrete(self);
    return self.modify((_) => [_, f(_)]);
  };
}

/**
 * Updates some values of the variable but leaves others alone, returning the
 * old value.
 *
 * @tsplus pipeable fncts.io.TRef getAndUpdateJust
 */
export function getAndUpdateJust<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, A> => {
    concrete(self);
    return self.modify((a) =>
      f(a).match(
        () => [a, a],
        (v) => [a, v],
      ),
    );
  };
}

/**
 * Updates the value of the variable.
 *
 * @tsplus pipeable fncts.io.TRef update
 */
export function update<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, void> => {
    concrete(self);
    return self.modify((a) => [undefined, f(a)]);
  };
}

/**
 * Updates some values of the variable but leaves others alone.
 *
 * @tsplus pipeable fncts.io.TRef updateJust
 */
export function updateJust<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, void> => {
    return self.update((a) => f(a).getOrElse(a));
  };
}

/**
 * Updates the value of the variable and returns the new value.
 *
 * @tsplus pipeable fncts.io.TRef updateAndGet
 */
export function updateAndGet<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, A> => {
    concrete(self);
    return self.modify((a) => {
      const newValue = f(a);
      return [newValue, newValue];
    });
  };
}

/**
 * Updates some values of the variable but leaves others alone.
 *
 * @tsplus pipeable fncts.io.TRef updateJustAndGet
 */
export function updateJustAndGet<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <E>(self: PTRef<E, E, A, A>): STM<never, E, A> => {
    return self.updateAndGet((a) => f(a).getOrElse(a));
  };
}

/**
 * @tsplus pipeable fncts.io.TRef unsafeSet
 */
export function unsafeSet<A>(journal: Journal, a: A, __tsplusTrace?: string) {
  return <EA, EB, B>(self: PTRef<EA, EB, A, B>): void => {
    concrete(self);
    return self.unsafeSet(journal, a);
  };
}
