/**
 * @tsplus fluent fncts.io.IO provideLayer
 */
export function provideLayer_<RIn, E, ROut, E1, A>(
  self: IO<ROut, E1, A>,
  layer: Layer<RIn, E, ROut>,
): IO<RIn, E | E1, A> {
  return Scope.make.bracketExit(
    (scope) => layer.build(scope).flatMap((r) => self.provideEnvironment(r)),
    (scope, exit) => scope.close(exit),
  );
}
