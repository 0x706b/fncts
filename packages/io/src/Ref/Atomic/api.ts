import type { Atomic } from "./Atomic.js";

/**
 * @tsplus fluent fncts.io.Ref.Atomic getAndSet
 */
export function getAndSet<A>(self: Atomic<A>, a: A, __tsplusTrace?: string): UIO<A> {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    self.unsafeSet(a);
    return v;
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic getAndUpdate
 */
export function getAndUpdate<A>(self: Atomic<A>, f: (a: A) => A, __tsplusTrace?: string) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    self.unsafeSet(f(v));
    return v;
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic getAndUpdateJust
 */
export function getAndUpdateJust<A>(self: Atomic<A>, f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    const o = f(v);
    Maybe.concrete(o);
    if (o._tag === "Just") {
      self.unsafeSet(o.value);
    }
    return v;
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic modify
 */
export function modify<A, B>(self: Atomic<A>, f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    const o = f(v);
    self.unsafeSet(o[1]);
    return o[0];
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic modifyJust
 */
export function modifyJust<A, B>(self: Atomic<A>, def: B, f: (a: A) => Maybe<readonly [B, A]>, __tsplusTrace?: string) {
  return IO.succeed(() => {
    const v = self.unsafeGet;
    const o = f(v);

    Maybe.concrete(o);
    if (o._tag === "Just") {
      self.unsafeSet(o.value[1]);
      return o.value[0];
    }

    return def;
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic update
 */
export function update<A>(self: Atomic<A>, f: (a: A) => A, __tsplusTrace?: string) {
  return IO.succeed(() => {
    self.unsafeSet(f(self.unsafeGet));
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic updateAndGet
 */
export function updateAndGet<A>(self: Atomic<A>, f: (a: A) => A, __tsplusTrace?: string) {
  return IO.succeed(() => {
    self.unsafeSet(f(self.unsafeGet));
    return self.unsafeGet;
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic updateJust
 */
export function updateJust<A>(self: Atomic<A>, f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return IO.succeed(() => {
    const o = f(self.unsafeGet);

    Maybe.concrete(o);
    if (o._tag === "Just") {
      self.unsafeSet(o.value);
    }
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic updateJustAndGet
 */
export function updateJustAndGet<A>(self: Atomic<A>, f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return IO.succeed(() => {
    const o = f(self.unsafeGet);

    Maybe.concrete(o);
    if (o._tag === "Just") {
      self.unsafeSet(o.value);
    }

    return self.unsafeGet;
  });
}

/**
 * @tsplus fluent fncts.io.Ref.Atomic unsafeUpdate
 */
export function unsafeUpdate<A>(self: Atomic<A>, f: (a: A) => A, __tsplusTrace?: string) {
  return self.unsafeSet(f(self.unsafeGet));
}
