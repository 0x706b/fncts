/**
 * Collects all fibers into a single fiber producing an in-order list of the
 * results.
 *
 * @tsplus static fncts.control.FiberOps sequenceIterable
 */
export function sequenceIterable<E, A>(fibers: Iterable<Fiber<E, A>>): Fiber.Synthetic<E, Conc<A>> {
  return {
    _tag: "SyntheticFiber",
    getRef: (ref) =>
      IO.foldLeft(fibers, ref.initial, (a, fiber) =>
        fiber.getRef(ref).map((a2) => ref.join(a, a2)),
      ),
    inheritRefs: IO.foreachDiscard(fibers, (f) => f.inheritRefs),
    interruptAs: (fiberId) =>
      IO.foreach(fibers, (f) => f.interruptAs(fiberId)).map((exits) =>
        exits.foldRight(Exit.succeed(Conc.empty<A>()) as Exit<E, Conc<A>>, (a, b) =>
          a.zipWithCause(b, (a, as) => as.prepend(a), Cause.both),
        ),
      ),
    poll: IO.foreach(fibers, (f) => f.poll).map((exits) =>
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
    await: Fiber.awaitAll(fibers),
  };
}
