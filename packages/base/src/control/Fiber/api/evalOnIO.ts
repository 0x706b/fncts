/**
 * A fully-featured, but much slower version of `evalOn`, which is useful
 * when environment and error are required.
 *
 * @tsplus fluent fncts.control.Fiber evalOnIO
 */
export function evalOnIO_<E, A, R1, E1, B, R2, E2, C>(
  fiber: Fiber<E, A>,
  effect: IO<R1, E1, B>,
  orElse: IO<R2, E2, C>,
): IO<R1 & R2, E1 | E2, B | C> {
  return IO.gen(function* (_) {
    const r = yield* _(IO.environment<R1 & R2>());
    const f = yield* _(Future.make<E1 | E2, B | C>());
    yield* _(
      fiber.evalOn(
        f.fulfill(effect.provideEnvironment(r)),
        f.fulfill(orElse.provideEnvironment(r)),
      ),
    );
    return yield* _(f.await);
  });
}
