import type { PRef } from "../definition";

import { concrete } from "../definition";

/**
 * Unsafe update value in a Ref<A>
 *
 * @tsplus fluent fncts.control.Ref unsafeUpdate
 */
export function unsafeUpdate_<A>(
  ref: PRef<unknown, unknown, never, never, A, A>,
  f: (a: A) => A
): void {
  concrete(ref);
  switch (ref._tag) {
    case "Atomic":
      return ref.unsafeUpdate(f);
    case "Derived":
      return ref.use((value, getEither, setEither) =>
        value.unsafeUpdate((s) => setEither(f(getEither(s).value)).value)
      );
    case "DerivedAll":
      return ref.use((value, getEither, setEither) =>
        value.unsafeUpdate((s) => setEither(f(getEither(s).value))(s).value)
      );
  }
}
