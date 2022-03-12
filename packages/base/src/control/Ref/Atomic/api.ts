import type { Maybe } from "../../../data/Maybe.js";
import type { UIO } from "../../IO.js";
import type { Atomic } from "./Atomic.js";

import { IO } from "../../IO.js";

/**
 * @tsplus fluent fncts.control.Ref.Atomic getAndSet
 */
export function getAndSet<A>(self: Atomic<A>, a: A): UIO<A> {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    self.unsafeSet(a);
    return v;
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic getAndUpdate
 */
export function getAndUpdate<A>(self: Atomic<A>, f: (a: A) => A) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    self.unsafeSet(f(v));
    return v;
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic getAndUpdateJust
 */
export function getAndUpdateJust<A>(self: Atomic<A>, f: (a: A) => Maybe<A>) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    const o = f(v);
    if (o._tag === "Just") {
      self.unsafeSet(o.value);
    }
    return v;
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic modify
 */
export function modify<A, B>(self: Atomic<A>, f: (a: A) => readonly [B, A]) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    const o = f(v);
    self.unsafeSet(o[1]);
    return o[0];
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic modifyJust
 */
export function modifyJust<A, B>(self: Atomic<A>, def: B, f: (a: A) => Maybe<readonly [B, A]>) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    const o = f(v);

    if (o._tag === "Just") {
      self.unsafeSet(o.value[1]);
      return o.value[0];
    }

    return def;
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic update
 */
export function update<A>(self: Atomic<A>, f: (a: A) => A) {
  return IO.succeed(() => {
    self.unsafeSet(f(self.unsafeGet));
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic updateAndGet
 */
export function updateAndGet<A>(self: Atomic<A>, f: (a: A) => A) {
  return IO.succeed(() => {
    self.unsafeSet(f(self.unsafeGet));
    return self.unsafeGet;
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic updateJust
 */
export function updateJust<A>(self: Atomic<A>, f: (a: A) => Maybe<A>) {
  return IO.succeed(() => {
    const o = f(self.unsafeGet);

    if (o._tag === "Just") {
      self.unsafeSet(o.value);
    }
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic updateJustAndGet
 */
export function updateJustAndGet<A>(self: Atomic<A>, f: (a: A) => Maybe<A>) {
  return IO.succeed(() => {
    const o = f(self.unsafeGet);

    if (o._tag === "Just") {
      self.unsafeSet(o.value);
    }

    return self.unsafeGet;
  });
}

/**
 * @tsplus fluent fncts.control.Ref.Atomic unsafeUpdate
 */
export function unsafeUpdate<A>(self: Atomic<A>, f: (a: A) => A) {
  return self.unsafeSet(f(self.unsafeGet));
}
