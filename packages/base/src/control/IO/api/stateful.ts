import type { Spreadable } from "../../../types.js";

import { State } from "../../State.js";

/**
 * @tsplus static fncts.control.IOOps stateful
 */
export function stateful<S, R, E, A>(
  s: S,
  io: Lazy<IO<Has<State<S>> & R, E, A>>,
  tag: Tag<State<S>>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.defer(io)(IO.$.provideSomeLayer(State.initial(s, tag)));
}