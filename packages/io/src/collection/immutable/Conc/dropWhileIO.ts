/**
 * @tsplus pipeable fncts.Conc dropWhileIO
 */
export function dropWhileIO<A, R, E>(p: (a: A) => IO<R, E, boolean>, __tsplusTrace?: string) {
  return (self: Conc<A>): IO<R, E, Conc<A>> => {
    return IO.defer(() => {
      const builder                   = new ConcBuilder<A>();
      let dropping: IO<R, E, boolean> = IO.succeedNow(true);
      for (const elem of self) {
        dropping = dropping.flatMap((d) =>
          (d ? p(elem) : IO.succeedNow(false)).map((b) => {
            if (b) {
              return true;
            } else {
              builder.append(elem);
              return false;
            }
          }),
        );
      }
      return dropping.as(builder.result());
    });
  };
}
