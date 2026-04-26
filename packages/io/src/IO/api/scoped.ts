/**
 * Runs this scoped effect in a new scope that is immediately closed when the effect completes.
 *
 * @tsplus static fncts.io.IOOps scoped
 */
export function scoped_<R, E, A>(io: Lazy<IO<R, E, A>>, __tsplusTrace?: string): IO<Exclude<R, Scope>, E, A> {
  return Scope.make.flatMap((scope) => scope.use(io));
}

/**
 * Runs this scoped effect in a new scope that is immediately closed when the effect completes.
 *
 * @tsplus getter fncts.io.IO scoped
 */
export function scoped<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<Exclude<R, Scope>, E, A> {
  return IO.scoped(io);
}
