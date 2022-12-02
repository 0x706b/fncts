/**
 * @tsplus getter fncts.io.IO daemonChildren
 */
export function daemonChildren<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return FiberRef.forkScopeOverride.locally(Just(FiberScope.global))(self);
}
