/**
 * @tsplus static fncts.io.IOOps addFinalizer
 */
export function addFinalizer<R>(
  finalizer: Lazy<URIO<R, any>>,
  __tsplusTrace?: string,
): IO<R | Scope, never, void> {
  return IO.addFinalizerExit(() => finalizer());
}
