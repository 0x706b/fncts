/**
 * @tsplus static fncts.control.IOOps addFinalizer
 */
export function addFinalizer<R>(
  finalizer: Lazy<URIO<R, any>>,
  __tsplusTrace?: string,
): IO<R & Has<Scope>, never, void> {
  return IO.addFinalizerExit(() => finalizer());
}
