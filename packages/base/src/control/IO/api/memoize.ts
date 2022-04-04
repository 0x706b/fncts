/**
 * @tsplus getter fncts.control.IO memoize
 */
export function memoize<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): UIO<IO<R, E, A>> {
  return IO.gen(function* (_) {
    const future   = yield* _(Future.make<E, A>());
    const complete = yield* _(future.fulfill(self).once);
    return complete > future.await;
  });
}
