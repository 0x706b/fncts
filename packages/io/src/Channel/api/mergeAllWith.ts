import { identity } from "@fncts/base/data/function";

export type MergeStrategy = "BackPressure" | "BufferSliding";

/**
 * @tsplus pipeable fncts.io.Channel mergeAllWith
 */
export function mergeAllWith<OutDone>(
  n: number,
  f: (x: OutDone, y: OutDone) => OutDone,
  bufferSize = 16,
  mergeStrategy: MergeStrategy = "BackPressure",
) {
  return <Env, InErr, InElem, InDone, OutErr, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem>(
    channels: Channel<
      Env,
      InErr,
      InElem,
      InDone,
      OutErr,
      Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, OutDone>,
      OutDone
    >,
  ): Channel<Env | Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem, OutDone> => {
    return Channel.unwrapScoped(
      IO.withChildren((getChildren) =>
        Do((Δ) => {
          Δ(IO.addFinalizer(getChildren.flatMap(Fiber.interruptAll)));
          const queue = Δ(
            IO.acquireRelease(
              Queue.makeBounded<IO<Env, OutErr | OutErr1, Either<OutDone, OutElem>>>(bufferSize),
              (queue) => queue.shutdown,
            ),
          );
          const cancelers    = Δ(IO.acquireRelease(Queue.makeUnbounded<Future<never, void>>(), (queue) => queue.shutdown));
          const lastDone     = Δ(Ref.make<Maybe<OutDone>>(Nothing()));
          const errorSignal  = Δ(Future.make<never, void>());
          const permits      = Δ(Semaphore(n));
          const pull         = Δ(channels.toPull);
          const evaluatePull = (pull: IO<Env | Env1, OutErr | OutErr1, Either<OutDone, OutElem>>) =>
            pull
              .flatMap((ea) =>
                ea.match({
                  Left: (outDone) => IO.succeedNow(Just(outDone)),
                  Right: (outElem) => queue.offer(IO.succeedNow(Either.right(outElem))).as(Nothing()),
                }),
              )
              .repeatUntil((m) => m.isJust())
              .flatMap((md1) =>
                md1.match(
                  () => IO.unit,
                  (outDone) =>
                    lastDone.update((md2) =>
                      md2.match(
                        () => Just(outDone),
                        (lastDone) => Just(f(lastDone, outDone)),
                      ),
                    ),
                ),
              );
          Δ(
            pull
              .matchCauseIO(
                (cause) =>
                  getChildren.flatMap(Fiber.interruptAll).zipRight(queue.offer(IO.failCauseNow(cause)).as(false)),
                (doneOrChannel) =>
                  doneOrChannel.match({
                    Left: (outDone) =>
                      errorSignal.await.raceWith(
                        permits.withPermits(n)(IO.unit),
                        (_, permitAcquisition) =>
                          getChildren.flatMap(Fiber.interruptAll).zipRight(permitAcquisition.interrupt.as(false)),
                        (_, failureAwait) =>
                          failureAwait.interrupt.zipRight(
                            lastDone.get
                              .flatMap((maybeDone) =>
                                maybeDone.match(
                                  () => queue.offer(IO.succeedNow(Either.left(outDone))),
                                  (lastDone) => queue.offer(IO.succeedNow(Either.left(f(lastDone, outDone)))),
                                ),
                              )
                              .as(false),
                          ),
                      ),
                    Right: (channel) => {
                      switch (mergeStrategy) {
                        case "BackPressure":
                          return Do((Δ) => {
                            const latch   = Δ(Future.make<never, void>());
                            const raceIOs = channel.toPull.flatMap((io) =>
                              evaluatePull(io).race(errorSignal.await),
                            ).scoped;
                            Δ(permits.withPermit(latch.succeed(undefined).zipRight(raceIOs)).fork);
                            Δ(latch.await);
                            return Δ(errorSignal.isDone.map((b) => !b));
                          });
                        case "BufferSliding":
                          return Do((Δ) => {
                            const canceler = Δ(Future.make<never, void>());
                            const latch    = Δ(Future.make<never, void>());
                            const size     = Δ(cancelers.size);
                            Δ(cancelers.take.flatMap((f) => f.succeed(undefined)).when(size >= 0));
                            const raceIOs = channel.toPull.flatMap((io) =>
                              evaluatePull(io).race(errorSignal.await).race(canceler.await),
                            ).scoped;
                            Δ(permits.withPermit(latch.succeed(undefined).zipRight(raceIOs)).fork);
                            Δ(latch.await);
                            return Δ(errorSignal.isDone.map((b) => !b));
                          });
                      }
                    },
                  }),
              )
              .repeatWhile(identity).fork,
          );
          return queue;
        }),
      ).map((queue) => {
        const consumer: Channel<Env | Env1, unknown, unknown, unknown, OutErr | OutErr1, OutElem, OutDone> =
          Channel.unwrap(
            queue.take.flatten.matchCause(Channel.failCauseNow, (out) =>
              out.match({ Left: Channel.endNow, Right: (outElem) => Channel.writeNow(outElem).zipRight(consumer) }),
            ),
          );
        return consumer;
      }),
    );
  };
}
