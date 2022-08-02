/**
 * @tsplus getter fncts.io.IO memoize
 */
export function memoize<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): UIO<IO<R, E, A>> {
  return Do((_) => {
    const future   = _(Future.make<E, A>());
    const complete = _(future.fulfill(self).once);
    return complete > future.await;
  });
}
