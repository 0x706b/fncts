import { SyntheticFiber } from "@fncts/io/Fiber/definition";

/**
 * Collects all fibers into a single fiber producing an in-order list of the
 * results.
 *
 * @tsplus static fncts.io.FiberOps sequenceIterable
 */
export function sequenceIterable<E, A>(
  fibers: Iterable<Fiber<E, A>>,
  __tsplusTrace?: string,
): Fiber.Synthetic<E, Conc<A>> {
  return new SyntheticFiber(
    fibers.foldLeft(FiberId.none as FiberId, (b, a) => b.combine(a.id)),
    Fiber.awaitAll(fibers),
    IO.foreachConcurrent(fibers, (fiber) => fiber.children).map((c) => c.flatten),
    IO.foreachDiscard(fibers, (f) => f.inheritRefs),
    IO.foreach(fibers, (f) => f.poll).map((exits) =>
      exits.foldRight(Just(Exit.succeed(Conc.empty()) as Exit<E, Conc<A>>), (a, b) =>
        a.match(
          () => Nothing(),
          (ra) =>
            b.match(
              () => Nothing(),
              (rb) => Just(ra.zipWithCause(rb, (a, as) => as.prepend(a), Cause.both)),
            ),
        ),
      ),
    ),
    (fiberId) => IO.foreach(fibers, (fiber) => fiber.interruptAsFork(fiberId)),
  );
}
