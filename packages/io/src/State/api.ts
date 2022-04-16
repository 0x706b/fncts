import type { State } from "./definition.js";

import { concrete } from "./definition.js";
import { StateInternal } from "./internal.js";

/**
 * @tsplus getter fncts.io.State get
 */
export function get_<S>(self: State<S>, __tsplusTrace?: string): UIO<S> {
  concrete(self);
  return self.get;
}

/**
 * @tsplus static fncts.io.StateOps initial
 */
export function initial<S>(s: S, tag: Tag<State<S>>): Layer<unknown, never, Has<State<S>>> {
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
 * @tsplus fluent fncts.io.State set
 */
export function set_<S>(self: State<S>, value: S, __tsplusTrace?: string): UIO<void> {
  concrete(self);
  return self.set(value);
}

/**
 * @tsplus fluent fncts.io.State update
 */
export function update_<S>(self: State<S>, f: (s: S) => S, __tsplusTrace?: string): UIO<void> {
  concrete(self);
  return self.update(f);
}
