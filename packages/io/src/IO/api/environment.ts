/**
 * Provides some of the environment required to run this `IO`,
 * leaving the remainder `R0`.
 *
 * @tsplus pipeable fncts.io.IO contramapEnvironment
 */
export function contramapEnvironment<R0, R>(f: (r0: Environment<R0>) => Environment<R>, __tsplusTrace?: string) {
  return <E, A>(self: IO<R, E, A>): IO<R0, E, A> => {
    return IO.environmentWithIO((r0: Environment<R0>) => self.provideEnvironment(f(r0)));
  };
}

/**
 * Accesses the environment provided to an `IO`
 *
 * @tsplus static fncts.io.IOOps environment
 */
export function environment<R>(__tsplusTrace?: string): URIO<R, Environment<R>> {
  return IO.defer(FiberRef.currentEnvironment.get as URIO<R, Environment<R>>);
}

/**
 * Accesses the environment provided to an `IO`
 *
 * @tsplus static fncts.io.IOOps environmentWith
 */
export function environmentWith<R, A>(f: (_: Environment<R>) => A, __tsplusTrace?: string): URIO<R, A> {
  return IO.environment<R>().map(f);
}

/**
 * Effectfully accesses the environment provided to an `IO`
 *
 * @tsplus static fncts.io.IOOps environmentWithIO
 */
export function environmentWithIO<R0, R, E, A>(
  f: (r: Environment<R0>) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R | R0, E, A> {
  return IO.environment<R0>().flatMap(f);
}

/**
 * Provides all of the environment required to compute a MonadEnv
 *
 * Provides the `IO` with its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus pipeable fncts.io.IO provideEnvironment
 */
export function provideEnvironment<R>(r: Environment<R>, __tsplusTrace?: string) {
  return <E, A>(self: IO<R, E, A>): FIO<E, A> => {
    return FiberRef.currentEnvironment.locallyWith((_) => _.union(r))(self as FIO<E, A>);
  };
}

/**
 * @tsplus pipeable fncts.io.IO provideSomeEnvironment
 */
export function provideSomeEnvironment<R0>(environment: Environment<R0>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<Exclude<R, R0>, E, A> => {
    return self.contramapEnvironment((r0) => r0.union(environment));
  };
}

/**
 * @tsplus pipeable fncts.io.IO provideService
 */
export function provideService<Id, Value>(service: Value, tag: Tag<Id, Value>, __tsplusTrace?: string) {
  return <E, A>(self: IO<Id, E, A>): FIO<E, A> => {
    return self.provideEnvironment(Environment().add(service, tag));
  };
}

/**
 * @tsplus pipeable fncts.io.IO provideSomeService
 * @tsplus static fncts.io.IOAspects provideSomeService
 */
export function provideSomeService<Id, Value>(service: Value, tag: Tag<Id, Value>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<Exclude<R, Id>, E, A> => {
    return self.contramapEnvironment((r: Environment<Exclude<R, Id>>) => r.add(service, tag) as Environment<R>);
  };
}

/**
 * @tsplus static fncts.io.IOOps service
 */
export function service<Id, Value>(tag: Tag<Id, Value>, __tsplusTrace?: string): IO<Id, never, Value> {
  return IO.serviceWithIO(IO.succeedNow, tag);
}
/**
 * @tsplus static fncts.io.IOOps serviceWith
 */
export function serviceWith<Id, Value, A>(
  f: (service: Value) => A,
  tag: Tag<Id, Value>,
  __tsplusTrace?: string,
): IO<Id, never, A> {
  return IO.serviceWithIO((s) => IO.succeedNow(f(s)), tag);
}
/**
 * @tsplus static fncts.io.IOOps serviceWithIO
 */
export function serviceWithIO<Id, Value, R, E, A>(
  f: (service: Value) => IO<R, E, A>,
  tag: Tag<Id, Value>,
  __tsplusTrace?: string,
): IO<R | Id, E, A> {
  return IO.defer(FiberRef.currentEnvironment.get.flatMap((environment) => f(environment.unsafeGet(tag))));
}
