/**
 * Runs this effect only when the Ref value satisfies the predicate.
 *
 * @tsplus pipeable fncts.io.IO whenRef
 *
 * @tsplus static fncts.io.IOOps whenRef
 */
export function whenRef<S>(ref: Ref<S>, f: Predicate<S>) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E, Maybe<A>> => {
    return self.whenIO(ref.get.map(f));
  };
}
