/**
 * @tsplus static fncts.io.ScopedRefOps fromAcquire
 */
export function fromAcquire<R, E, A>(acquire: IO<R, E, A>, __tsplusTrace?: string): IO<R | Scope, E, ScopedRef<A>> {
  return IO.uninterruptibleMask(({ restore }) =>
    Do((_) => {
      const newScope = _(Scope.make);
      const a        = _(
        restore(acquire.provideSomeService(newScope, Scope.Tag).tapCause((cause) => newScope.close(Exit.fail(cause)))),
      );
      const ref       = _(Ref.Synchronized.make([newScope, a] as const));
      const scopedRef = new Synch(ref);
      _(IO.addFinalizer(scopedRef.close));
      return scopedRef;
    }),
  );
}

class Synch<A> extends ScopedRef<A> {
  constructor(readonly ref: Ref.Synchronized<readonly [Scope.Closeable, A]>) {
    super();
  }

  close: UIO<void> = this.ref.get.flatMap(([scope, _]) => scope.close(Exit.unit));

  set<R, E>(acquire: IO<R, E, A>, __tsplusTrace?: string): IO<Exclude<R, Scope>, E, void> {
    return this.ref.modifyIO(([oldScope, a]) =>
      IO.uninterruptibleMask(({ restore }) =>
        Do((_) => {
          const newScope = _(Scope.make);
          const exit     = _(restore(acquire.provideSomeService(newScope, Scope.Tag)).result);
          return _(
            exit.match(
              (cause): UIO<readonly [FIO<E, void>, readonly [Scope.Closeable, A]]> =>
                newScope.close(Exit.unit).ignore.as([IO.failCauseNow(cause), [oldScope, a]] as const),
              (a) => oldScope.close(Exit.unit).ignore.as([IO.unit, [newScope, a]] as const),
            ),
          );
        }),
      ),
    ).flatten;
  }

  get: UIO<A> = this.ref.get.map(([_, a]) => a);
}
