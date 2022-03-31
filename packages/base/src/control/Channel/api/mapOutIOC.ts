import { Either } from "../../../data/Either.js";
import { Fiber } from "../../Fiber.js";
import { Future } from "../../Future.js";
import { IO } from "../../IO.js";
import { Queue } from "../../Queue.js";
import { TSemaphore } from "../../TSemaphore.js";
import { Channel } from "../definition.js";

/**
 * @tsplus fluent fncts.control.Channel mapOutIOC
 */
export function mapOutIOC_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutDone,
  Env1,
  OutErr1,
  OutElem1,
>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  n: number,
  f: (_: OutElem) => IO<Env1, OutErr1, OutElem1>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem1, OutDone> {
  return Channel.scoped(
    IO.withChildren((getChildren) =>
      IO.gen(function* (_) {
        yield* _(IO.addFinalizer(getChildren.chain(Fiber.interruptAll)));
        const queue = yield* _(
          IO.acquireRelease(
            Queue.makeBounded<IO<Env1, OutErr | OutErr1, Either<OutDone, OutElem1>>>(n),
            (queue) => queue.shutdown,
          ),
        );
        const errorSignal = yield* _(Future.make<OutErr1, never>());
        const permits     = yield* _(TSemaphore.make(n).commit);
        const pull        = yield* _(self.toPull);
        yield* _(
          pull.matchCauseIO(
            (cause) => queue.offer(IO.failCauseNow(cause)),
            (r) =>
              r.match(
                (outDone) =>
                  permits
                    .withPermits(n)(IO.unit)
                    .interruptible.apSecond(queue.offer(IO.succeedNow(Either.left(outDone))))
                    .asUnit,
                (outElem) =>
                  IO.gen(function* (_) {
                    const p     = yield* _(Future.make<OutErr1, OutElem1>());
                    const latch = yield* _(Future.make<never, void>());
                    yield* _(queue.offer(p.await.map(Either.right)));
                    yield* _(
                      permits.withPermit(
                        latch.succeed(undefined).apSecond(
                          errorSignal.await
                            .raceFirst(f(outElem))
                            .tapErrorCause((c) => p.failCause(c))
                            .fulfill(p),
                        ),
                      ),
                    );
                    yield* _(latch.await);
                  }),
              ),
          ).forever.uninterruptible.fork,
        );
        return queue;
      }),
    ),
    (queue) => {
      const consumer: Channel<
        Env & Env1,
        unknown,
        unknown,
        unknown,
        OutErr | OutErr1,
        OutElem1,
        OutDone
      > = Channel.unwrap(
        queue.take.flatten.matchCause(Channel.failCauseNow, (r) =>
          r.match(Channel.endNow, (outElem) => Channel.writeNow(outElem).apSecond(consumer)),
        ),
      );
      return consumer;
    },
  );
}
