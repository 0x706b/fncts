import { identity } from "@fncts/base/data/function";

export type MergeStrategy = "BackPressure" | "BufferSliding";

/**
 * @tsplus fluent fncts.io.Channel mergeAllWith
 */
export function mergeAllWith_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutDone,
  Env1,
  InErr1,
  InElem1,
  InDone1,
  OutErr1,
  OutElem,
>(
  channels: Channel<
    Env,
    InErr,
    InElem,
    InDone,
    OutErr,
    Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, OutDone>,
    OutDone
  >,
  n: number,
  f: (x: OutDone, y: OutDone) => OutDone,
  bufferSize = 16,
  mergeStrategy: MergeStrategy = "BackPressure",
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem, OutDone> {
  return Channel.unwrapScoped(
    IO.withChildren((getChildren) =>
      IO.gen(function* (_) {
        yield* _(IO.addFinalizer(getChildren.flatMap(Fiber.interruptAll)));
        const queue = yield* _(
          IO.acquireRelease(
            Queue.makeBounded<IO<Env, OutErr | OutErr1, Either<OutDone, OutElem>>>(bufferSize),
            (queue) => queue.shutdown,
          ),
        );
        const cancelers = yield* _(
          IO.acquireRelease(Queue.makeUnbounded<Future<never, void>>(), (queue) => queue.shutdown),
        );
        const lastDone    = yield* _(Ref.make<Maybe<OutDone>>(Nothing()));
        const errorSignal = yield* _(Future.make<never, void>());
        const permits     = yield* _(TSemaphore.make(n).commit);
        const pull        = yield* _(channels.toPull);

        const evaluatePull = (pull: IO<Env & Env1, OutErr | OutErr1, Either<OutDone, OutElem>>) =>
          pull
            .flatMap((ea) =>
              ea.match(
                (outDone) => IO.succeedNow(Just(outDone)),
                (outElem) => queue.offer(IO.succeedNow(Either.right(outElem))).as(Nothing()),
              ),
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

        yield* _(
          pull
            .matchCauseIO(
              (cause) => getChildren.flatMap(Fiber.interruptAll).apSecond(queue.offer(IO.failCauseNow(cause)).as(false)),
              (doneOrChannel) =>
                doneOrChannel.match(
                  (outDone) =>
                    errorSignal.await.raceWith(
                      permits.withPermits(n)(IO.unit),
                      (_, permitAcquisition) =>
                        getChildren.flatMap(Fiber.interruptAll).apSecond(permitAcquisition.interrupt.as(false)),
                      (_, failureAwait) =>
                        failureAwait.interrupt.apSecond(
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
                  (channel) => {
                    switch (mergeStrategy) {
                      case "BackPressure":
                        return IO.gen(function* (_) {
                          const latch   = yield* _(Future.make<never, void>());
                          const raceIOs = channel.toPull.flatMap((io) => evaluatePull(io).race(errorSignal.await)).scoped;
                          yield* _(permits.withPermit(latch.succeed(undefined).apSecond(raceIOs)).fork);
                          yield* _(latch.await);
                          return !(yield* _(errorSignal.isDone));
                        });
                      case "BufferSliding":
                        return IO.gen(function* (_) {
                          const canceler = yield* _(Future.make<never, void>());
                          const latch    = yield* _(Future.make<never, void>());
                          const size     = yield* _(cancelers.size);
                          yield* _(cancelers.take.flatMap((f) => f.succeed(undefined)).when(size >= 0));
                          const raceIOs = channel.toPull.flatMap((io) =>
                            evaluatePull(io).race(errorSignal.await).race(canceler.await),
                          ).scoped;
                          yield* _(permits.withPermit(latch.succeed(undefined).apSecond(raceIOs)).fork);
                          yield* _(latch.await);
                          return !(yield* _(errorSignal.isDone));
                        });
                    }
                  },
                ),
            )
            .repeatWhile(identity).fork,
        );
        return queue;
      }),
    ).map((queue) => {
      const consumer: Channel<Env & Env1, unknown, unknown, unknown, OutErr | OutErr1, OutElem, OutDone> =
        Channel.unwrap(
          queue.take.flatten.matchCause(Channel.failCauseNow, (out) =>
            out.match(Channel.endNow, (outElem) => Channel.writeNow(outElem).apSecond(consumer)),
          ),
        );
      return consumer;
    }),
  );
}
