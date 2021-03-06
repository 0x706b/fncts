/**
 * @tsplus fluent fncts.Conc dropUntilIO
 */
export function dropUntilIO<A, R, E>(
  self: Conc<A>,
  p: (a: A) => IO<R, E, boolean>,
  __tsplusTrace?: string,
): IO<R, E, Conc<A>> {
  return IO.defer(() => {
    const builder                   = new ConcBuilder<A>();
    let dropping: IO<R, E, boolean> = IO.succeedNow(false);
    for (const elem of self) {
      dropping = dropping.flatMap((b) => {
        if (b) {
          builder.append(elem);
          return IO.succeedNow(true);
        } else {
          return p(elem);
        }
      });
    }
    return dropping.as(builder.result());
  });
}
