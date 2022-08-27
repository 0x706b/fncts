/**
 * Imports an asynchronous side-effect into an IO. The side-effect
 * has the option of returning the value synchronously, which is useful in
 * cases where it cannot be determined if the effect is synchronous or
 * asynchronous until the side-effect is actually executed. The effect also
 * has the option of returning a canceler, which will be used by the runtime
 * to cancel the asynchronous effect if the fiber executing the effect is
 * interrupted.
 *
 * If the register function returns a value synchronously, then the callback
 * function must not be called. Otherwise the callback function must be called
 * at most once.
 *
 * The list of fibers, that may complete the async callback, is used to
 * provide better diagnostics.
 *
 * @tsplus static fncts.io.IOOps asyncInterrupt
 */
export function asyncInterrupt<R, E, A>(
  register: (cb: (resolve: IO<R, E, A>) => void) => Either<URIO<R, any>, IO<R, E, A>>,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.defer(() => {
    let cancelerRef: URIO<R, any> = IO.unit!;
    return IO.async<R, E, A>((k) => {
      const result = register(k);
      result.match(
        (canceler) => {
          cancelerRef = canceler;
        },
        (done) => {
          k(done);
        },
      );
    }, blockingOn).onInterrupt(() => cancelerRef);
  });
}

/**
 * Imports an asynchronous effect into a pure `IO`, possibly returning the value synchronously.
 *
 * If the register function returns a value synchronously, then the callback
 * function must not be called. Otherwise the callback function must be called at most once.
 *
 * @tsplus static fncts.io.IOOps asyncMaybe
 */
export function asyncMaybe<R, E, A>(
  register: (resolve: (_: IO<R, E, A>) => void) => Maybe<IO<R, E, A>>,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return asyncInterrupt(
    (cb) => register(cb).match(() => Either.left(IO.unit), Either.right),
    blockingOn,
    __tsplusTrace,
  );
}

/**
 * Returns a `IO` that will never produce anything. The moral equivalent of
 * `while(true) {}`, only without the wasted CPU cycles.
 *
 * @tsplus static fncts.io.IOOps never
 */
export const never: UIO<never> = IO.defer(() =>
  asyncInterrupt<never, never, never>(() => {
    const interval = setInterval(() => {
      //
    }, 60000);
    return Either.left(
      IO.succeed(() => {
        clearInterval(interval);
      }),
    );
  }),
);
