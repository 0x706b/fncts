import type { Tag } from "../../data/Tag.js";
import type { Has } from "../../prelude.js";
import type { UIO } from "../IO/definition.js";
import type { State } from "./definition.js";

import { FiberRef } from "../FiberRef.js";
import { Layer } from "../Layer.js";
import { concrete } from "./definition.js";
import { StateInternal } from "./internal.js";

/**
 * @tsplus getter fncts.control.State get
 */
export function get_<S>(self: State<S>, __tsplusTrace?: string): UIO<S> {
  concrete(self);
  return self.get;
}

/**
 * @tsplus static fncts.control.StateOps initial
 */
export function initial<S>(tag: Tag<State<S>>) {
  return (s: S): Layer<unknown, never, Has<State<S>>> =>
    Layer.scoped(tag)(
      FiberRef.make(s).map((ref) => new class extends StateInternal<S> {
        get: UIO<S> = ref.get;
        set(s: S, __tsplusTrace?: string): UIO<void> {
          return ref.set(s);
        }
        update(f: (s: S) => S, __tsplusTrace?: string): UIO<void> {
          return ref.update(f);
        }
      }())
    );
}

/**
 * @tsplus fluent fncts.control.State set
 */
export function set_<S>(self: State<S>, value: S, __tsplusTrace?: string): UIO<void> {
  concrete(self);
  return self.set(value);
}

/**
 * @tsplus fluent fncts.control.State update
 */
export function update_<S>(self: State<S>, f: (s: S) => S, __tsplusTrace?: string): UIO<void> {
  concrete(self);
  return self.update(f);
}