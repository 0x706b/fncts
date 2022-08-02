/**
 * @tsplus static fncts.io.IOOps scopeWith
 */
export function scopeWith<R, E, A>(f: (scope: Scope) => IO<R, E, A>): IO<R | Scope, E, A> {
  return IO.serviceWithIO(f, Scope.Tag);
}
