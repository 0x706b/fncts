/**
 * @tsplus pipeable fncts.Conc mapIO
 */
export function mapIO<A, R, E, B>(f: (a: A) => IO<R, E, B>, __tsplusTrace?: string) {
  return (self: Conc<A>): IO<R, E, Conc<B>> => {
    return IO.foreach(self, f);
  };
}
