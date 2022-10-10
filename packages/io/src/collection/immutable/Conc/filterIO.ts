/**
 * @tsplus pipeable fncts.Conc filterIO
 */
export function filterIO<A, R, E>(p: (a: A) => IO<R, E, boolean>, __tsplusTrace?: string) {
  return (self: Conc<A>): IO<R, E, Conc<A>> => {
    return IO.defer(() => {
      const builder = new ConcBuilder<A>();
      let dest: IO<R, E, ConcBuilder<A>> = IO.succeedNow(builder);
      for (const a of self) {
        dest = dest.zipWith(p(a), (builder, res) => {
          if (res) return builder.append(a);
          else return builder;
        });
      }
      return dest.map((builder) => builder.result());
    });
  };
}
