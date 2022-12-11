/**
 * @tsplus pipeable fncts.io.IO whenFiberRef
 * @tsplus static fncts.io.IOOps whenFiberRef
 */
export function whenFiberRef<S>(ref: FiberRef<S>, f: Predicate<S>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E, Maybe<A>> => {
    return self.whenIO(ref.get.map(f));
  };
}
