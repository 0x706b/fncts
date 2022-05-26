/**
 * Returns a new scoped workflow that returns the result of this workflow as
 * well as a finalizer that can be run to close the scope of this workflow.
 *
 * @tsplus getter fncts.io.IO withEarlyRelease
 */
export function withEarlyRelease<R, E, A>(self: IO<R, E, A>): IO<R & Has<Scope>, E, readonly [UIO<void>, A]> {
  return IO.scopeWith((parent) =>
    parent.fork.flatMap((child) =>
      child.extend(self).map((a) => [IO.fiberId.flatMap((fiberId) => child.close(Exit.interrupt(fiberId))), a]),
    ),
  );
}
