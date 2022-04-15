import type { PRef } from "../definition.js";

import { tuple } from "../../../data/function.js";
import { concrete } from "../definition.js";

/**
 * Atomically modifies the `Ref` with the specified function, which
 * computes a return value for the modification. This is a more powerful
 * version of `update`.
 *
 * @tsplus fluent fncts.control.Ref modify
 * @tsplus fluent fncts.control.Ref.Synchronized modify
 */
export function modify_<RA, RB, EA, EB, B, A>(
  ref: PRef<RA, RB, EA, EB, A, A>,
  f: (a: A) => readonly [B, A],
): IO<RA & RB, EA | EB, B> {
  concrete(ref);
  switch (ref._tag) {
    case "Atomic":
      return ref.modify(f);
    case "Derived":
      return ref.use(
        (value, getEither, setEither) =>
          value.modify((s) =>
            getEither(s).match(
              (e) => tuple(Either.left(e), s),
              (a1) => {
                const [b, a2] = f(a1);
                return setEither(a2).match(
                  (e) => tuple(Either.left(e), s),
                  (s) => tuple(Either.right<EA | EB, B>(b), s),
                );
              },
            ),
          ).absolve,
      );
    case "DerivedAll":
      return ref.use(
        (value, getEither, setEither) =>
          value.modify((s) =>
            getEither(s).match(
              (e) => tuple(Either.left(e), s),
              (a1) => {
                const [b, a2] = f(a1);
                return setEither(a2)(s).match(
                  (e) => tuple(Either.left(e), s),
                  (s) => tuple(Either.right<EA | EB, B>(b), s),
                );
              },
            ),
          ).absolve,
      );
    case "Synchronized":
      return ref.modifyIO((a) => IO.succeedNow(f(a)));
  }
}

/**
 * Atomically modifies the `Ref` with the specified partial function,
 * which computes a return value for the modification if the function is
 * defined on the current value otherwise it returns a default value. This
 * is a more powerful version of `updateJust`.
 *
 * @tsplus fluent fncts.control.Ref modifyJust
 * @tsplus fluent fncts.control.Ref.Synchronized modifyJust
 */
export function modifyJust_<RA, RB, EA, EB, A, B>(
  self: PRef<RA, RB, EA, EB, A, A>,
  def: B,
  f: (a: A) => Maybe<readonly [B, A]>,
): IO<RA & RB, EA | EB, B> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.modifyJust(def, f);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a) => f(a).getOrElse(tuple(def, a)));
  }
}

/**
 * Atomically writes the specified value to the `Ref`, returning the value
 * immediately before modification.
 *
 * @tsplus fluent fncts.control.Ref getAndSet
 * @tsplus fluent fncts.control.Ref.Synchronized getAndSet
 */
export function getAndSet_<RA, RB, EA, EB, A>(self: PRef<RA, RB, EA, EB, A, A>, a: A): IO<RA & RB, EA | EB, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.getAndSet(a);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a0) => tuple(a0, a));
  }
}

/**
 * Atomically modifies the `Ref` with the specified function, returning
 * the value immediately before modification.
 *
 * @tsplus fluent fncts.control.Ref getAndUpdate
 * @tsplus fluent fncts.control.Ref.Synchronized getAndUpdate
 */
export function getAndUpdate_<RA, RB, EA, EB, A>(
  self: PRef<RA, RB, EA, EB, A, A>,
  f: (a: A) => A,
): IO<RA & RB, EA | EB, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.getAndUpdate(f);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a0) => tuple(a0, f(a0)));
  }
}

/**
 * Atomically modifies the `Ref` with the specified partial function,
 * returning the value immediately before modification. If the function is
 * undefined on the current value it doesn't change it.
 *
 * @tsplus fluent fncts.control.Ref getAndUpdateJust
 * @tsplus fluent fncts.control.Ref.Synchronized getAndUpdateJust
 */
export function getAndUpdateJust_<RA, RB, EA, EB, A>(
  self: PRef<RA, RB, EA, EB, A, A>,
  f: (a: A) => Maybe<A>,
): IO<RA & RB, EA | EB, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.getAndUpdateJust(f);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a0) => tuple(a0, f(a0).getOrElse(a0)));
  }
}

/**
 * Atomically modifies the `Ref` with the specified function.
 *
 * @tsplus fluent fncts.control.Ref update
 * @tsplus fluent fncts.control.Ref.Synchronized update
 */
export function update_<RA, RB, EA, EB, A>(
  self: PRef<RA, RB, EA, EB, A, A>,
  f: (a: A) => A,
): IO<RA & RB, EA | EB, void> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.update(f);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a0) => tuple(undefined, f(a0)));
  }
}

/**
 * Atomically modifies the `Ref` with the specified function and returns
 * the updated value.
 *
 * @tsplus fluent fncts.control.Ref updateAndGet
 * @tsplus fluent fncts.control.Ref.Synchronized updateAndGet
 */
export function updateAndGet_<RA, RB, EA, EB, A>(
  self: PRef<RA, RB, EA, EB, A, A>,
  f: (a: A) => A,
): IO<RA & RB, EA | EB, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.updateAndGet(f);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a0) => {
        const r = f(a0);
        return tuple(r, r);
      });
  }
}

/**
 * Atomically modifies the `Ref` with the specified partial function. If
 * the function is undefined on the current value it doesn't change it.
 *
 * @tsplus fluent fncts.control.Ref updateJust
 * @tsplus fluent fncts.control.Ref.Synchronized updateJust
 */
export function updateJust_<RA, RB, EA, EB, A>(
  self: PRef<RA, RB, EA, EB, A, A>,
  f: (a: A) => Maybe<A>,
): IO<RA & RB, EA | EB, void> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.updateJust(f);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a0) => tuple(undefined, f(a0).getOrElse(a0)));
  }
}

/**
 * Atomically modifies the `Ref` with the specified partial function. If
 * the function is undefined on the current value it returns the old value
 * without changing it.
 *
 * @tsplus fluent fncts.control.Ref updateJustAndGet
 * @tsplus fluent fncts.control.Ref.Synchronized updateJustAndGet
 */
export function updateJustAndGet_<RA, RB, EA, EB, A>(
  self: PRef<RA, RB, EA, EB, A, A>,
  f: (a: A) => Maybe<A>,
): IO<RA & RB, EA | EB, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return self.updateJustAndGet(f);
    default:
      return (self as PRef<RA, RB, EA, EB, A, A>).modify((a0) => {
        const r = f(a0).getOrElse(a0);
        return tuple(r, r);
      });
  }
}
