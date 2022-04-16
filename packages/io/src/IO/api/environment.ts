import type * as Intersection from "@fncts/typelevel/Intersection";

/**
 * Provides some of the environment required to run this `IO`,
 * leaving the remainder `R0`.
 *
 * @tsplus fluent fncts.control.IO contramapEnvironment
 */
export function contramapEnvironment_<R0, R, E, A>(
  self: IO<R, E, A>,
  f: (r0: Environment<R0>) => Environment<R>,
  __tsplusTrace?: string,
): IO<R0, E, A> {
  return IO.environmentWithIO((r0: Environment<R0>) => self.provideEnvironment(f(r0)));
}

/**
 * Accesses the environment provided to an `IO`
 *
 * @tsplus static fncts.control.IOOps environment
 */
export function environment<R>(__tsplusTrace?: string): URIO<R, Environment<R>> {
  return IO.defer(FiberRef.currentEnvironment.get as URIO<R, Environment<R>>);
}

/**
 * Accesses the environment provided to an `IO`
 *
 * @tsplus static fncts.control.IOOps environmentWith
 */
export function environmentWith<R, A>(f: (_: Environment<R>) => A, __tsplusTrace?: string): URIO<R, A> {
  return IO.environment<R>().map(f);
}

/**
 * Effectfully accesses the environment provided to an `IO`
 *
 * @tsplus static fncts.control.IOOps environmentWithIO
 */
export function environmentWithIO<R0, R, E, A>(
  f: (r: Environment<R0>) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R & R0, E, A> {
  return IO.environment<R0>().flatMap(f);
}

/**
 * Provides all of the environment required to compute a MonadEnv
 *
 * Provides the `IO` with its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus fluent fncts.control.IO provideEnvironment
 */
export function provideEnvironment_<R, E, A>(self: IO<R, E, A>, r: Environment<R>, __tsplusTrace?: string): FIO<E, A> {
  return FiberRef.currentEnvironment.locallyWith((_) => _.union(r))(self as FIO<E, A>);
}

/**
 * @tsplus fluent fncts.control.IO provideSomeEnvironment
 */
export function provideSomeEnvironment_<R, E, A, R0>(
  self: IO<R, E, A>,
  environment: Environment<R0>,
  __tsplusTrace?: string,
): IO<Intersection.Erase<R, R0>, E, A> {
  return self.contramapEnvironment((r0) => r0.union(environment));
}

/**
 * @tsplus fluent fncts.control.IO provideService
 */
export function provideService_<E, A, T>(
  self: IO<Has<T>, E, A>,
  service: T,
  tag: Tag<T>,
  __tsplusTrace?: string,
): FIO<E, A> {
  return self.provideEnvironment(Environment().add(service, tag));
}

/**
 * @tsplus fluent fncts.control.IO provideSomeService
 */
export function provideSomeService_<R, E, A, T>(
  self: IO<R, E, A>,
  service: T,
  tag: Tag<T>,
  __tsplusTrace?: string,
): IO<Intersection.Erase<R, Has<T>>, E, A> {
  return self.contramapEnvironment((r: Environment<R>) => r.add(service, tag));
}

/**
 * @tsplus static fncts.control.IOAspects provideSomeService
 */
export function provideSomeService<T>(service: T, tag: Tag<T>, __tsplusTrace?: string) {
  return <R, E, A>(io: IO<R & Has<T>, E, A>): IO<R, E, A> =>
    // @ts-expect-error
    io.provideSomeService(service, tag);
}

/**
 * @tsplus static fncts.control.IOOps service
 */
export function service<T>(tag: Tag<T>, __tsplusTrace?: string): IO<Has<T>, never, T> {
  return IO.serviceWithIO(IO.succeedNow, tag);
}

/**
 * @tsplus static fncts.control.IOOps serviceWith
 */
export function serviceWith<S, A>(f: (service: S) => A, tag: Tag<S>): IO<Has<S>, never, A> {
  return IO.serviceWithIO((s) => IO.succeedNow(f(s)), tag);
}

/**
 * @tsplus static fncts.control.IOOps serviceWithIO
 */
export function serviceWithIO<T, R, E, A>(
  f: (service: T) => IO<R, E, A>,
  tag: Tag<T>,
  __tsplusTrace?: string,
): IO<R & Has<T>, E, A> {
  return IO.defer(FiberRef.currentEnvironment.get.flatMap((environment) => f(environment.unsafeGet(tag))));
}
