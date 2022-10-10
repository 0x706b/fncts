/**
 * @tsplus pipeable fncts.Conc mapIO
 */
export function mapIO<A, R, E, B>(f: (a: A) => IO<R, E, B>, __tsplusTrace?: string) {
  return (as: Conc<A>): IO<R, E, Conc<B>> => {
    return IO.defer(() => {
      const out = Conc.builder<B>();
      return IO.foreachDiscard(as, (a) =>
        f(a).map((b) => {
          out.append(b);
        }),
      ).as(out.result());
    });
  };
}
