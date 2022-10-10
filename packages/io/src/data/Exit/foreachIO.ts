/**
 * Applies the function `f` to the successful result of the `Exit` and
 * returns the result in a new `Exit`.
 *
 * @tsplus pipeable fncts.Exit foreachIO
 */
export function foreachIO<A2, R, E, A>(f: (a: A2) => IO<R, E, A>, __tsplusTrace?: string) {
  return <E2>(exit: Exit<E2, A2>): IO<R, never, Exit<E | E2, A>> => {
    return exit.match(
      (c): URIO<R, Exit<E | E2, A>> => IO.succeedNow(Exit.failCause(c)),
      (a) => f(a).result,
    );
  };
}
