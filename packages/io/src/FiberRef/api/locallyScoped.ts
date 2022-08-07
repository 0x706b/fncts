/**
 * @tsplus fluent fncts.io.FiberRef locallyScoped
 */
export function locallyScoped_<A>(ref: FiberRef<A>, a: A, __tsplusTrace?: string): IO<Scope, never, void> {
  return IO.acquireRelease(
    ref.get.flatMap((old) => ref.set(a).as(old)),
    (a) => ref.set(a),
  ).asUnit;
}
