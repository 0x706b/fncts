/**
 * @tsplus pipeable fncts.io.FiberRef locallyScoped
 */
export function locallyScoped<A>(a: A, __tsplusTrace?: string) {
  return (ref: FiberRef<A>): IO<Scope, never, void> => {
    return IO.acquireRelease(
      ref.get.flatMap((old) => ref.set(a).as(old)),
      (a) => ref.set(a),
    ).asUnit;
  };
}
