/**
 * @tsplus pipeable fncts.Conc filterIO
 */
export function filterIO<A, R, E>(p: (a: A) => IO<R, E, boolean>, __tsplusTrace?: string) {
  return (self: Conc<A>): IO<R, E, Conc<A>> => {
    return IO.filter(self, p);
  };
}
