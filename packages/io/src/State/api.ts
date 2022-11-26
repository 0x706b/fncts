import type { State } from "./definition.js";

import { concrete } from "./definition.js";
import { StateInternal } from "./internal.js";

/**
 * @tsplus getter fncts.io.State get
 */
export function get<S>(self: State<S>, __tsplusTrace?: string): UIO<S> {
  concrete(self);
  return self.get;
}

/**
 * @tsplus static fncts.io.StateOps initial
 */
export function initial<S>(s: S, tag: Tag<State<S>>, __tsplusTrace?: string): Layer<never, never, State<S>> {
  return Layer.scoped(
    FiberRef.make(s).map(
      (ref) =>
        new (class extends StateInternal<S> {
          get: UIO<S> = ref.get;
          set(s: S, __tsplusTrace?: string): UIO<void> {
            return ref.set(s);
          }
          update(f: (s: S) => S, __tsplusTrace?: string): UIO<void> {
            return ref.update(f);
          }
        })(),
    ),
    tag,
  );
}

/**
 * @tsplus pipeable fncts.io.State set
 */
export function set<S>(value: S, __tsplusTrace?: string) {
  return (self: State<S>): UIO<void> => {
    concrete(self);
    return self.set(value);
  };
}

/**
 * @tsplus pipeable fncts.io.State update
 */
export function update<S>(f: (s: S) => S, __tsplusTrace?: string) {
  return (self: State<S>): UIO<void> => {
    concrete(self);
    return self.update(f);
  };
}
