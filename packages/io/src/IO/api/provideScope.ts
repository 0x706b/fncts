/**
 * @tsplus pipeable fncts.io.IO provideScope
 */
export function provideScope(scope: Scope) {
  return <R, E, A>(self: IO<R, E, A>): IO<Exclude<R, Scope>, E, A> => {
    return self.provideSomeService(scope, Scope.Tag);
  };
}
