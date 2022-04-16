import type { Spreadable } from "@fncts/base/types";

import { State } from "../../State.js";

/**
 * @tsplus static fncts.io.IOOps stateful
 */
export function stateful<S, R, E, A>(
  s: S,
  io: Lazy<IO<Has<State<S>> & R, E, A>>,
  tag: Tag<State<S>>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.defer(io)(IO.$.provideSomeLayer(State.initial(s, tag)));
}
