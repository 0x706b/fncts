/**
 * @tsplus static fncts.io.IOOps asyncIO
 */
export function asyncIO<R, E, A>(register: (k: (_: IO<R, E, A>) => void) => IO<R, E, void>): IO<R, E, A> {
  return Do((Δ) => {
    const f = Δ(Future.make<E, A>());
    const r = Δ(IO.runtime<R>());
    const a = Δ(
      IO.uninterruptibleMask(({ restore }) => {
        const io = register((k) => r.unsafeRunAsync(k.fulfill(f)));
        return restore(io.catchAllCause((cause) => f.failCause(cause))).fork > restore(f.await);
      }),
    );
    return a;
  });
}
