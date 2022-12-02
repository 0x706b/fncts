import { concrete } from "@fncts/io/FiberRef/definition";

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
