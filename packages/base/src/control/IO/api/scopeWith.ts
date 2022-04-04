/**
 * @tsplus static fncts.control.IOOps scopeWith
 */
export function scopeWith<R, E, A>(f: (scope: Scope) => IO<R, E, A>): IO<R & Has<Scope>, E, A> {
  return IO.serviceWithIO(Scope.Tag)(f);
}
