/**
 * @tsplus fluent fncts.io.TFuture done
 */
export function done_<E, A>(self: TFuture<E, A>, v: Either<E, A>, __tsplusTrace?: string): USTM<boolean> {
  return TFuture.reverseGet(self).get.flatMap((mea) =>
    mea.match(
      () =>
        TFuture.reverseGet(self)
          .set(Just(v))
          .flatMap(() => STM.succeedNow(true)),
      () => STM.succeedNow(false),
    ),
  );
}

/**
 * @tsplus fluent fncts.io.TFuture fail
 */
export function fail_<E, A>(self: TFuture<E, A>, e: E, __tsplusTrace?: string): USTM<boolean> {
  return self.done(Either.left(e));
}

/**
 * @tsplus getter fncts.io.TFuture poll
 */
export function poll<E, A>(self: TFuture<E, A>, __tsplusTrace?: string): USTM<Maybe<Either<E, A>>> {
  return TFuture.reverseGet(self).get;
}

/**
 * @tsplus fluent fncts.io.TFuture succeed
 */
export function succeed_<E, A>(self: TFuture<E, A>, a: A, __tsplusTrace?: string): USTM<boolean> {
  return self.done(Either.right(a));
}

/**
 * @tsplus getter fncts.io.TFuture await
 */
export function wait<E, A>(self: TFuture<E, A>, __tsplusTrace?: string): STM<never, E, A> {
  return TFuture.reverseGet(self).get.filterMapSTM((mea) => mea.map(STM.fromEitherNow));
}
