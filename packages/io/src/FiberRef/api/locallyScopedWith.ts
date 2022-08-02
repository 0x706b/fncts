/**
 * @tsplus fluent fncts.io.FiberRef locallyScopedWith
 */
export function locallyScopedWith<A>(self: FiberRef<A>, f: (a: A) => A): IO<Scope, never, void> {
  return self.getWith((a) => self.locallyScoped(f(a)));
}
