import { concrete } from "@fncts/io/FiberRef/definition";

/**
 * @tsplus pipeable fncts.io.FiberRef modify
 */
export function modify<A, B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
  return (self: FiberRef<A>): UIO<B> => {
    concrete(self);
    return IO.withFiberContext((fiber) =>
      IO(() => {
        const [result, newValue] = f(fiber.unsafeGetRef(self));
        fiber.unsafeSetRef(self, newValue);
        return result;
      }),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.FiberRef update
 */
export function update<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return (fiberRef: FiberRef<A>): UIO<void> => {
    return fiberRef.modify((a) => [undefined, f(a)]);
  };
}

/**
 * @tsplus pipeable fncts.io.FiberRef set
 */
export function set<A>(a: A, __tsplusTrace?: string) {
  return (fiberRef: FiberRef<A>): UIO<void> => {
    return fiberRef.modify(() => [undefined, a]);
  };
}

/**
 * @tsplus getter fncts.io.FiberRef get
 */
export function get<A>(fiberRef: FiberRef<A>, __tsplusTrace?: string): UIO<A> {
  return fiberRef.modify((a) => [a, a]);
}

/**
 * @tsplus pipeable fncts.io.FiberRef getAndSet
 */
export function getAndSet<A>(a: A, __tsplusTrace?: string) {
  return (fiberRef: FiberRef<A>): UIO<A> => {
    return fiberRef.modify((v) => [v, a]);
  };
}

/**
 * @tsplus pipeable fncts.io.FiberRef getAndUpdate
 */
export function getAndUpdate<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return (fiberRef: FiberRef<A>): UIO<A> => {
    return fiberRef.modify((a) => [a, f(a)]);
  };
}

/**
 * @tsplus pipeable fncts.io.FiberRef getAndUpdateJust
 */
export function getAndUpdateJust<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return (fiberRef: FiberRef<A>): UIO<A> => {
    return fiberRef.modify((a) => [a, f(a).getOrElse(a)]);
  };
}

/**
 * Returns an `IO` that runs with `value` bound to the current fiber.
 *
 * Guarantees that fiber data is properly restored via `bracket`.
 *
 * @tsplus fluent fncts.io.FiberRef locally
 */
export function locally<A>(fiberRef: FiberRef<A>, value: A, __tsplusTrace?: string) {
  return <R1, E1, B>(use: IO<R1, E1, B>): IO<R1, E1, B> =>
    IO.withFiberContext((fiber) =>
      IO.defer(() => {
        const oldValue = fiber.unsafeGetRef(fiberRef);
        fiber.unsafeSetRef(fiberRef, value);
        fiber.unsafeAddFinalizer(
          IO(() => {
            fiber.unsafeSetRef(fiberRef, oldValue);
          }),
        );
        return use;
      }),
    );
}

/**
 * Returns an `IO` that runs with `f` applied to the current fiber.
 *
 * Guarantees that fiber data is properly restored via `bracket`.
 *
 * @tsplus fluent fncts.io.FiberRef locallyWith
 */
export function locallyWith<A>(self: FiberRef<A>, f: (a: A) => A, __tsplusTrace?: string) {
  return <R1, E1, B>(use: IO<R1, E1, B>): IO<R1, E1, B> => self.getWith((a) => self.locally(f(a))(use));
}

/**
 * @tsplus pipeable fncts.io.FiberRef getWith
 */
export function getWith<A, R, E, B>(f: (a: A) => IO<R, E, B>, __tsplusTrace?: string) {
  return (fiberRef: FiberRef<A>): IO<R, E, B> => {
    return IO.withFiberContext((fiber) => f(fiber.unsafeGetRef(fiberRef)));
  };
}

/**
 * @tsplus getter fncts.io.FiberRef remove
 */
export function remove<A>(self: FiberRef<A>, __tsplusTrace?: string): UIO<void> {
  return IO.withFiberContext((fiber) => IO(fiber.unsafeDeleteRef(self)));
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

/**
 * @tsplus pipeable fncts.io.FiberRef join
 */
export function join<Value>(oldValue: Value, newValue: Value) {
  return <Patch>(self: FiberRef.WithPatch<Value, Patch>): Value => {
    concrete(self);
    return self._join(oldValue, newValue);
  };
}
