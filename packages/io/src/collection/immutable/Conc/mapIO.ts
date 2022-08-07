/**
 * @tsplus fluent fncts.Conc mapIO
 */
export function mapIO_<A, R, E, B>(as: Conc<A>, f: (a: A) => IO<R, E, B>, __tsplusTrace?: string): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const out = Conc.builder<B>();
    return IO.foreachDiscard(as, (a) =>
      f(a).map((b) => {
        out.append(b);
      }),
    ).as(out.result());
  });
}
