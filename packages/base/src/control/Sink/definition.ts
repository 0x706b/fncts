import type { Conc } from "../../collection/immutable/Conc";
import type { Channel } from "../Channel";

/**
 * Sink is a data type that represent a channel that reads elements
 * of type `In`, handles input errors of type `InErr`, emits errors
 * of type `OutErr`, emits outputs of type `L` and ends with a value
 * of type `Z`.
 *
 * @tsplus type fncts.control.Sink
 * @tsplus companion fncts.control.SinkOps
 */
export class Sink<R, E, In, L, Z> {
  constructor(readonly channel: Channel<R, never, Conc<In>, unknown, E, Conc<L>, Z>) {}
}
