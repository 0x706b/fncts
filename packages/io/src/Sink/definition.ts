/**
 * Sink is a data type that represent a channel that reads elements
 * of type `In`, emits errors of type `OutErr`, emits outputs of type `Out` and ends with a value
 * of type `Done`.
 *
 * @tsplus type fncts.io.Sink
 * @tsplus companion fncts.io.SinkOps
 */
export class Sink<Env, OutErr, In, Out, Done> {
  constructor(readonly channel: Channel<Env, never, Conc<In>, unknown, OutErr, Conc<Out>, Done>) {}
}
