/**
 * @tsplus static fncts.io.TFutureOps make
 * @tsplus static fncts.io.TFutureOps __call
 */
export function make<E, A>(): USTM<TFuture<E, A>> {
  return TRef.make<Maybe<Either<E, A>>>(Nothing()).map((_) => TFuture.get(_));
}

/**
 * @tsplus static fncts.io.TFutureOps makeCommit
 */
export function makeCommit<E, A>(): UIO<TFuture<E, A>> {
  return TFuture.make<E, A>().commit;
}
