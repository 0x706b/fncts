import type { PSetter, PSetterPartiallyApplied } from "@fncts/base/optics/Setter";

/**
 * Focuses a setter on a specific source value for direct set and modify calls.
 *
 * @tsplus fluent global focus 3
 */
export function focus<S, T, A, B>(self: S, setter: PSetter<S, T, A, B>): PSetterPartiallyApplied<T, A, B> {
  return {
    set: (b) => setter.set(b)(self),
    modify: (f) => setter.modify(f)(self),
  };
}
