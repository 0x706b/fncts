import { identity } from "@fncts/base/data/function";
import { concrete } from "@fncts/io/FiberRef/definition";
import { FiberRefDelete, FiberRefLocally, FiberRefModify, FiberRefWith } from "@fncts/io/IO/definition";

/**
 * @tsplus fluent fncts.io.FiberRef modify
 */
export function modify_<A, B>(self: FiberRef<A>, f: (a: A) => readonly [B, A], __tsplusTrace?: string): UIO<B> {
  concrete(self);
  return new FiberRefModify(self, f, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.io.FiberRef update
 */
export function update_<A>(fiberRef: FiberRef<A>, f: (a: A) => A, __tsplusTrace?: string): UIO<void> {
  return fiberRef.modify((a) => [undefined, f(a)]);
}

/**
 * @tsplus fluent fncts.io.FiberRef set
 */
export function set_<A>(fiberRef: FiberRef<A>, a: A): UIO<void> {
  return fiberRef.modify(() => [undefined, a]);
}

/**
 * @tsplus getter fncts.io.FiberRef get
 */
export function get<A>(fiberRef: FiberRef<A>): UIO<A> {
  return fiberRef.modify((a) => [a, a]);
}

/**
 * @tsplus fluent fncts.io.FiberRef getAndSet
 */
export function getAndSet_<A>(fiberRef: FiberRef<A>, a: A): UIO<A> {
  return fiberRef.modify((v) => [v, a]);
}

/**
 * @tsplus fluent fncts.io.FiberRef getAndUpdate
 */
export function getAndUpdate_<A>(fiberRef: FiberRef<A>, f: (a: A) => A): UIO<A> {
  return fiberRef.modify((a) => [a, f(a)]);
}

/**
 * @tsplus fluent fncts.io.FiberRef getAndUpdateJust
 */
export function getAndUpdateJust_<A>(fiberRef: FiberRef<A>, f: (a: A) => Maybe<A>): UIO<A> {
  return fiberRef.modify((a) => [a, f(a).getOrElse(a)]);
}

/**
 * Returns an `IO` that runs with `value` bound to the current fiber.
 *
 * Guarantees that fiber data is properly restored via `bracket`.
 *
 * @tsplus fluent fncts.io.FiberRef locally
 */
export function locally_<A>(fiberRef: FiberRef<A>, value: A) {
  return <R1, E1, B>(use: IO<R1, E1, B>): IO<R1, E1, B> => {
    return new FiberRefLocally(value, fiberRef, use);
  };
}

/**
 * Returns an `IO` that runs with `f` applied to the current fiber.
 *
 * Guarantees that fiber data is properly restored via `bracket`.
 *
 * @tsplus fluent fncts.io.FiberRef locallyWith
 */
export function locallyWith_<A>(self: FiberRef<A>, f: (a: A) => A) {
  return <R1, E1, B>(use: IO<R1, E1, B>): IO<R1, E1, B> => self.getWith((a) => self.locally(f(a))(use));
}

/**
 * @tsplus fluent fncts.io.FiberRef getWith
 */
export function getWith_<A, R, E, B>(
  fiberRef: FiberRef<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, B> {
  return new FiberRefWith(fiberRef, f, __tsplusTrace);
}

/**
 * @tsplus getter fncts.io.FiberRef remove
 */
export function remove<A>(self: FiberRef<A>, __tsplusTrace?: string): UIO<void> {
  return new FiberRefDelete(self, __tsplusTrace);
}

/**
 * @tsplus getter fncts.io.FiberRef diff
 */
export function diff<Value, Patch>(self: FiberRef.WithPatch<Value, Patch>) {
  concrete(self);
  return (oldValue: Value, newValue: Value): Patch => self._diff(oldValue, newValue);
}

/**
 * @tsplus getter fncts.io.FiberRef initial
 */
export function initial<Value, Patch>(self: FiberRef.WithPatch<Value, Patch>): Value {
  concrete(self);
  return self._initial;
}

/**
 * @tsplus getter fncts.io.FiberRef combine
 */
export function combine<Value, Patch>(self: FiberRef.WithPatch<Value, Patch>) {
  concrete(self);
  return (first: Patch, second: Patch) => self._combine(first, second);
}

/**
 * @tsplus getter fncts.io.FiberRef patch
 */
export function patch<Value, Patch>(self: FiberRef.WithPatch<Value, Patch>) {
  concrete(self);
  return (patch: Patch) => (oldValue: Value) => self._patch(patch)(oldValue);
}

/**
 * @tsplus getter fncts.io.FiberRef fork
 */
export function fork<Value, Patch>(self: FiberRef.WithPatch<Value, Patch>): Patch {
  concrete(self);
  return self._fork;
}
