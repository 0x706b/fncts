/**
 * Forks the workflow in the specified scope. The fiber will be interrupted
 * when the scope is closed.
 *
 * @tsplus pipeable fncts.io.IO forkIn
 */
export function forkIn(scope: Scope, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): URIO<R, Fiber.Runtime<E, A>> => {
    return IO.uninterruptibleMask(({ restore }) =>
      restore(self).forkDaemon.tap((fiber) => scope.addFinalizer(fiber.interrupt)),
    );
  };
}
