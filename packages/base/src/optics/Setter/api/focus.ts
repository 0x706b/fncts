import type { PSetter, PSetterPartiallyApplied } from "@fncts/base/optics/Setter";

/**
 * @tsplus pipeable global focus 3
 */
export function focus<S, T, A, B>(setter: PSetter<S, T, A, B>) {
  return (self: S): PSetterPartiallyApplied<T, A, B> => {
    return {
      set: (b) => setter.set(b)(self),
      modify: (f) => setter.modify(f)(self),
    };
  };
}
