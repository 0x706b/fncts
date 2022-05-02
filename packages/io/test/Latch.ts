export function withLatch<R, E, A>(f: (_: UIO<void>) => IO<R, E, A>): IO<R, E, A> {
  return Future.make<never, void>().flatMap((latch) => f(latch.succeed(undefined).asUnit) < latch.await);
}
