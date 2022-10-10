/**
 * @tsplus pipeable fncts.io.IO provideLayer
 */
export function provideLayer<RIn, E, ROut>(layer: Layer<RIn, E, ROut>, __tsplusTrace?: string) {
  return <E1, A>(self: IO<ROut, E1, A>): IO<RIn, E | E1, A> => {
    return Scope.make.bracketExit(
      (scope) => layer.build(scope).flatMap((r) => self.provideEnvironment(r)),
      (scope, exit) => scope.close(exit),
    );
  };
}
