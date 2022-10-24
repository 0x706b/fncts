import type { PRef } from "../definition.js";

import { tuple } from "@fncts/base/data/function";

import { concrete } from "../definition.js";

/**
 * Atomically modifies the `Ref` with the specified function, which
 * computes a return value for the modification. This is a more powerful
 * version of `update`.
 *
 * @tsplus pipeable fncts.io.Ref modify
 * @tsplus pipeable fncts.io.Ref.Synchronized modify
 */
export function modify<B, A>(f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, B> => {
    concrete(self);
    return self.modify(f);
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function,
 * which computes a return value for the modification if the function is
 * defined on the current value otherwise it returns a default value. This
 * is a more powerful version of `updateJust`.
 *
 * @tsplus pipeable fncts.io.Ref modifyJust
 * @tsplus pipeable fncts.io.Ref.Synchronized modifyJust
 */
export function modifyJust<A, B>(def: B, f: (a: A) => Maybe<readonly [B, A]>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, B> => {
    return self.modify((a) => f(a).getOrElse(tuple(def, a)));
  };
}

/**
 * Atomically writes the specified value to the `Ref`, returning the value
 * immediately before modification.
 *
 * @tsplus pipeable fncts.io.Ref getAndSet
 * @tsplus pipeable fncts.io.Ref.Synchronized getAndSet
 */
export function getAndSet<A>(a: A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, A> => {
    return self.modify((a0) => tuple(a0, a));
  };
}

/**
 * Atomically modifies the `Ref` with the specified function, returning
 * the value immediately before modification.
 *
 * @tsplus pipeable fncts.io.Ref getAndUpdate
 * @tsplus pipeable fncts.io.Ref.Synchronized getAndUpdate
 */
export function getAndUpdate<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, A> => {
    return self.modify((a0) => tuple(a0, f(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function,
 * returning the value immediately before modification. If the function is
 * undefined on the current value it doesn't change it.
 *
 * @tsplus pipeable fncts.io.Ref getAndUpdateJust
 * @tsplus pipeable fncts.io.Ref.Synchronized getAndUpdateJust
 */
export function getAndUpdateJust<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, A> => {
    return self.modify((a0) => tuple(a0, f(a0).getOrElse(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified function.
 *
 * @tsplus pipeable fncts.io.Ref update
 * @tsplus pipeable fncts.io.Ref.Synchronized update
 */
export function update<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, void> => {
    return self.modify((a0) => tuple(undefined, f(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified function and returns
 * the updated value.
 *
 * @tsplus pipeable fncts.io.Ref updateAndGet
 * @tsplus pipeable fncts.io.Ref.Synchronized updateAndGet
 */
export function updateAndGet<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>) => {
    return self.modify((a0) => {
      const r = f(a0);
      return tuple(r, r);
    });
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function. If
 * the function is undefined on the current value it doesn't change it.
 *
 * @tsplus pipeable fncts.io.Ref updateJust
 * @tsplus pipeable fncts.io.Ref.Synchronized updateJust
 */
export function updateJust<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, void> => {
    return self.modify((a0) => tuple(undefined, f(a0).getOrElse(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function. If
 * the function is undefined on the current value it returns the old value
 * without changing it.
 *
 * @tsplus pipeable fncts.io.Ref updateJustAndGet
 * @tsplus pipeable fncts.io.Ref.Synchronized updateJustAndGet
 */
export function updateJustAndGet<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, A>): IO<RA | RB, EA | EB, A> => {
    return self.modify((a0) => {
      const r = f(a0).getOrElse(a0);
      return tuple(r, r);
    });
  };
}
