/**
 * @tsplus pipeable fncts.io.Channel mapOutIOC
 */
export function mapOutIOC<OutElem, Env1, OutErr1, OutElem1>(n: number, f: (_: OutElem) => IO<Env1, OutErr1, OutElem1>) {
  return <Env, InErr, InElem, InDone, OutErr, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env | Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem1, OutDone> => {
    return Channel.unwrapScoped(
      IO.withChildren((getChildren) =>
        Do((Δ) => {
          Δ(IO.addFinalizer(getChildren.flatMap(Fiber.interruptAll)));
          const queue = Δ(
            IO.acquireRelease(
              Queue.makeBounded<IO<Env1, OutErr | OutErr1, Either<OutDone, OutElem1>>>(n),
              (queue) => queue.shutdown,
            ),
          );
          const errorSignal = Δ(Future.make<OutErr1, never>());
          const permits     = Δ(TSemaphore.make(n).commit);
          const pull        = Δ(self.toPull);
          Δ(
            pull.matchCauseIO(
              (cause) => queue.offer(IO.failCauseNow(cause)),
              (r) =>
                r.match(
                  (outDone) =>
                    permits
                      .withPermits(n)(IO.unit)
                      .interruptible.apSecond(queue.offer(IO.succeedNow(Either.left(outDone)))).asUnit,
                  (outElem) =>
                    Do((Δ) => {
                      const p     = Δ(Future.make<OutErr1, OutElem1>());
                      const latch = Δ(Future.make<never, void>());
                      Δ(queue.offer(p.await.map(Either.right)));
                      Δ(
                        permits.withPermit(
                          latch.succeed(undefined).apSecond(
                            errorSignal.await
                              .raceFirst(f(outElem))
                              .tapErrorCause((c) => p.failCause(c))
                              .fulfill(p),
                          ),
                        ),
                      );
                      Δ(latch.await);
                    }),
                ),
            ).forever.uninterruptible.fork,
          );
          return queue;
        }),
      ).map((queue) => {
        const consumer: Channel<Env | Env1, unknown, unknown, unknown, OutErr | OutErr1, OutElem1, OutDone> =
          Channel.unwrap(
            queue.take.flatten.matchCause(Channel.failCauseNow, (r) =>
              r.match(Channel.endNow, (outElem) => Channel.writeNow(outElem).apSecond(consumer)),
            ),
          );
        return consumer;
      }),
    );
  };
}
