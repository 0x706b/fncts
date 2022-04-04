import type { Spreadable } from "../../../types.js";

import { State } from "../../State.js";

/**
 * @tsplus static fncts.control.IOOps stateful
 */
export function stateful<S>(tag: Tag<State<S>>) {
  return <R extends Spreadable, E, A>(
    s: S,
    io: Lazy<IO<Has<State<S>> & R, E, A>>,
    __tsplusTrace?: string,
  ): IO<R, E, A> => IO.defer(io)(IO.$.provideSomeLayer(State.initial(tag)(s)));
}
