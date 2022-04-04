/**
 * Forks the workflow in the specified scope. The fiber will be interrupted
 * when the scope is closed.
 *
 * @tsplus fluent fncts.control.IO forkIn
 */
export function forkIn_<R, E, A>(
  self: IO<R, E, A>,
  scope: Scope,
  __tsplusTrace?: string,
): URIO<R, Fiber.Runtime<E, A>> {
  return IO.uninterruptibleMask(({ restore }) =>
    restore(self).forkDaemon.tap((fiber) => scope.addFinalizer(fiber.interrupt)),
  );
}
