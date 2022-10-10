/**
 * Acquires a resource, uses the resource, and then releases the resource.
 * Neither the acquisition nor the release will be interrupted, and the
 * resource is guaranteed to be released, so long as the `acquire` IO
 * succeeds. If `use` fails, then after release, the returned IO will fail
 * with the same error.
 *
 * @tsplus fluent fncts.io.IO bracketExit
 * @tsplus static fncts.io.IOOps bracketExit
 */
export function bracketExit<R, E, A, E1, R1, A1, R2, E2>(
  acquire: Lazy<IO<R, E, A>>,
  use: (a: A) => IO<R1, E1, A1>,
  release: (a: A, e: Exit<E1, A1>) => IO<R2, E2, any>,
  __tsplusTrace?: string,
): IO<R | R1 | R2, E | E1 | E2, A1> {
  return IO.uninterruptibleMask(({ restore }) =>
    acquire().flatMap((a) =>
      IO.defer(restore(use(a))).result.flatMap((exit) =>
        IO.defer(release(a, exit)).matchCauseIO(
          (cause2) =>
            IO.failCause(
              exit.match(
                (cause1) => Cause.then(cause1, cause2),
                () => cause2,
              ),
            ),
          () => IO.fromExit(exit),
        ),
      ),
    ),
  );
}
