/**
 * @tsplus pipeable fncts.io.FiberRef locallyScopedWith
 */
export function locallyScopedWith<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return (self: FiberRef<A>): IO<Scope, never, void> => {
    return self.getWith((a) => self.locallyScoped(f(a)));
  };
}
