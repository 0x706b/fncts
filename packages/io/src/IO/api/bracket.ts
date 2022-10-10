/**
 * When this IO represents acquisition of a resource (for example,
 * opening a file, launching a thread, etc.), `bracket` can be used to ensure
 * the acquisition is not interrupted and the resource is always released.
 *
 * The function does two things:
 *
 * 1. Ensures this IO, which acquires the resource, will not be
 * interrupted. Of course, acquisition may fail for internal reasons (an
 * uncaught exception).
 * 2. Ensures the `release` IO will not be interrupted, and will be
 * executed so long as this IO successfully acquires the resource.
 *
 * In between acquisition and release of the resource, the `use` IO is
 * executed.
 *
 * If the `release` IO fails, then the entire IO will fail even
 * if the `use` IO succeeds. If this fail-fast behavior is not desired,
 * errors produced by the `release` IO can be caught and ignored.
 *
 * @tsplus fluent fncts.io.IO bracket
 * @tsplus static fncts.io.IOOps bracket
 */
export function bracket<R, E, A, R1, E1, A1, R2, E2, A2>(
  acquire: Lazy<IO<R, E, A>>,
  use: (a: A) => IO<R1, E1, A1>,
  release: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
): IO<R | R1 | R2, E | E1 | E2, A1> {
  return IO.bracketExit(acquire, use, release);
}
