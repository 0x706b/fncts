import type { AsyncInputConsumer } from "@fncts/io/Channel/internal/AsyncInputConsumer";
import type { AsyncInputProducer } from "@fncts/io/Channel/internal/AsyncInputProducer";

import { Queue } from "@fncts/base/collection/immutable/Queue";
import { tuple } from "@fncts/base/data/function";

export const enum StateTag {
  Done = "Done",
  Error = "Error",
  Empty = "Empty",
  Emit = "Emit",
}

export class StateDone<Done> {
  readonly _stateTag = StateTag.Done;
  constructor(readonly a: Done) {}
}

export class StateError<E> {
  readonly _stateTag = StateTag.Error;
  constructor(readonly cause: Cause<E>) {}
}

export class StateEmpty {
  readonly _stateTag = StateTag.Empty;
  constructor(readonly notifyProducer: Future<never, void>) {}
}

export class StateEmit<Err, Elem, Done> {
  readonly _stateTag = StateTag.Emit;
  constructor(readonly notifyConsumers: Queue<Future<Err, Either<Done, Elem>>>) {}
}

export type State<Err, Elem, Done> = StateEmpty | StateEmit<Err, Elem, Done> | StateError<Err> | StateDone<Done>;

/**
 * An MVar-like abstraction for sending data to channels asynchronously. Designed
 * for one producer and multiple consumers.
 *
 * Features the following semantics:
 * - Buffer of size 1
 * - When emitting, the producer waits for a consumer to pick up the value
 *   to prevent "reading ahead" too much.
 * - Once an emitted element is read by a consumer, it is cleared from the buffer, so that
 *   at most one consumer sees every emitted element.
 * - When sending a done or error signal, the producer does not wait for a consumer
 *   to pick up the signal. The signal stays in the buffer after being read by a consumer,
 *   so it can be propagated to multiple consumers.
 * - Trying to publish another emit/error/done after an error/done have already been published
 *   results in an interruption.
 *
 * @tsplus companion fncts.io.Channel.SingleProducerAsyncInputOps
 */
export class SingleProducerAsyncInput<Err, Elem, Done>
  implements AsyncInputProducer<Err, Elem, Done>, AsyncInputConsumer<Err, Elem, Done>
{
  constructor(readonly ref: Ref<State<Err, Elem, Done>>) {}

  emit(el: Elem): UIO<unknown> {
    return Future.make<never, void>().flatMap(
      (p) =>
        this.ref.modify((state) => {
          switch (state._stateTag) {
            case StateTag.Emit: {
              const x = state.notifyConsumers.dequeue;
              Maybe.concrete(x);
              if (x.isNothing()) {
                return tuple(IO.unit, new StateEmpty(p));
              } else {
                const [notifyConsumer, notifyConsumers] = x.value;
                return tuple(
                  notifyConsumer.succeed(Either.right(el)),
                  notifyConsumers.length === 0 ? new StateEmpty(p) : new StateEmit(notifyConsumers),
                );
              }
            }
            case StateTag.Error: {
              return tuple(IO.interrupt, state);
            }
            case StateTag.Done: {
              return tuple(IO.interrupt, state);
            }
            case StateTag.Empty: {
              return tuple(state.notifyProducer.await, state);
            }
          }
        }).flatten,
    );
  }

  done(a: Done): UIO<unknown> {
    return this.ref.modify((state) => {
      switch (state._stateTag) {
        case StateTag.Emit: {
          return tuple(
            IO.foreachDiscard(state.notifyConsumers, (f) => f.succeed(Either.left(a))),
            new StateDone(a),
          );
        }
        case StateTag.Error: {
          return tuple(IO.interrupt, state);
        }
        case StateTag.Done: {
          return tuple(IO.interrupt, state);
        }
        case StateTag.Empty: {
          return tuple(state.notifyProducer.await, state);
        }
      }
    }).flatten;
  }

  error(cause: Cause<Err>): UIO<unknown> {
    return this.ref.modify((state) => {
      switch (state._stateTag) {
        case StateTag.Emit: {
          return tuple(
            IO.foreachDiscard(state.notifyConsumers, (f) => f.failCause(cause)),
            new StateError(cause),
          );
        }
        case StateTag.Error: {
          return tuple(IO.interrupt, state);
        }
        case StateTag.Done: {
          return tuple(IO.interrupt, state);
        }
        case StateTag.Empty: {
          return tuple(state.notifyProducer.await, state);
        }
      }
    }).flatten;
  }

  takeWith<X>(onError: (cause: Cause<Err>) => X, onElement: (element: Elem) => X, onDone: (done: Done) => X): UIO<X> {
    return Future.make<Err, Either<Done, Elem>>().flatMap(
      (p) =>
        this.ref.modify((state) => {
          switch (state._stateTag) {
            case StateTag.Emit: {
              return tuple(
                p.await.matchCause(onError, (de) => de.match(onDone, onElement)),
                new StateEmit(state.notifyConsumers.enqueue(p)),
              );
            }
            case StateTag.Error: {
              return tuple(IO.succeed(onError(state.cause)), state);
            }
            case StateTag.Done: {
              return tuple(IO.succeed(onDone(state.a)), state);
            }
            case StateTag.Empty: {
              return tuple(
                state.notifyProducer
                  .succeed(undefined)
                  .apSecond(p.await.matchCause(onError, (de) => de.match(onDone, onElement))),
                new StateEmit(Queue.single(p)),
              );
            }
          }
        }).flatten,
    );
  }

  take = this.takeWith<Exit<Either<Err, Done>, Elem>>(
    (c) => Exit.failCause(c.map(Either.left)),
    (el) => Exit.succeed(el),
    (d) => Exit.fail(Either.right(d)),
  );

  close = IO.fiberId.flatMap((id) => this.error(Cause.interrupt(id)));

  awaitRead: UIO<void> = this.ref.modify((s) =>
    s._stateTag === StateTag.Empty ? [s.notifyProducer.await, s] : [IO.unit, s],
  );
}

/**
 * Creates a SingleProducerAsyncInput
 *
 * @tsplus static fncts.io.Channel.SingleProducerAsyncInputOps __call
 */
export function makeSingleProducerAsyncInput<Err, Elem, Done>(): UIO<SingleProducerAsyncInput<Err, Elem, Done>> {
  return Future.make<never, void>()
    .flatMap((p) => Ref.make<State<Err, Elem, Done>>(new StateEmpty(p)))
    .map((ref) => new SingleProducerAsyncInput(ref));
}
