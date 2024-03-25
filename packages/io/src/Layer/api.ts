import type { Spreadable } from "@fncts/base/types";
import type { Runtime } from "@fncts/io/IO";

import { Fold, Fresh, FromScoped, Layer, To, ZipWithConcurrent } from "@fncts/io/Layer/definition";
import { DecisionTag } from "@fncts/io/Schedule";

/**
 * @tsplus pipeable fncts.io.Layer and
 */
export function and<RIn1, E1, ROut1>(that: Layer<RIn1, E1, ROut1>, __tsplusTrace?: string) {
  return <RIn, E, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1, E | E1, ROut | ROut1> => {
    return new ZipWithConcurrent(self, that, (a, b) => a.union(b), __tsplusTrace);
  };
}

/**
 * Feeds the output services of this layer into the input of the specified
 * layer, resulting in a new layer with the inputs of this layer, and the
 * outputs of both layers.
 *
 * @tsplus pipeable fncts.io.Layer andTo
 */
export function andTo<RIn1, E1, ROut1>(that: Layer<RIn1, E1, ROut1>, __tsplusTrace?: string) {
  return <RIn, E, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn | Exclude<RIn1, ROut>, E | E1, ROut | ROut1> => {
    return self.and(self.to(that));
  };
}

/**
 * Feeds the output services of this layer into the input of the specified
 * layer, resulting in a new layer with the inputs of this layer, and the
 * outputs of both layers.
 *
 * @tsplus pipeable fncts.io.Layer andTo
 */
export function andUsing<RIn, E, ROut>(that: Layer<RIn, E, ROut>, __tsplusTrace?: string) {
  return <RIn1, E1, ROut1>(self: Layer<RIn1, E1, ROut1>): Layer<RIn | Exclude<RIn1, ROut>, E | E1, ROut | ROut1> => {
    return that.and(that.to(self));
  };
}

/**
 * @tsplus pipeable fncts.io.Layer catchAll
 */
export function catchAll<E, RIn1, E1, ROut1>(f: (e: E) => Layer<RIn1, E1, ROut1>, __tsplusTrace?: string) {
  return <RIn, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1, E1, ROut | ROut1> => {
    return self.matchLayer(f, Layer.succeedEnvironmentNow);
  };
}

/**
 * @tsplus pipeable fncts.io.Layer flatMap
 */
export function flatMap<ROut, RIn1, E1, ROut1>(
  f: (r: Environment<ROut>) => Layer<RIn1, E1, ROut1>,
  __tsplusTrace?: string,
) {
  return <RIn, E>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1, E | E1, ROut1> => {
    return self.matchLayer(Layer.failNow, f);
  };
}

/**
 * @tsplus pipeable fncts.io.Layer compose
 */
export function compose<ROut, E1, ROut1>(that: Layer<ROut, E1, ROut1>, __tsplusTrace?: string) {
  return <RIn, E>(self: Layer<RIn, E, ROut>): Layer<RIn, E | E1, ROut1> => {
    return new To(self, that, __tsplusTrace);
  };
}

/**
 * @tsplus static fncts.io.LayerOps environment
 */
export function environment<RIn>(__tsplusTrace?: string): Layer<RIn, never, RIn> {
  return Layer(IO.environment<RIn>());
}

/**
 * @tsplus static fncts.io.LayerOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): Layer<never, E, never> {
  return Layer(IO.fail(e));
}

/**
 * @tsplus static fncts.io.LayerOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>, __tsplusTrace?: string): Layer<never, E, never> {
  return Layer(IO.failCause(cause));
}

/**
 * @tsplus static fncts.io.LayerOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): Layer<never, E, never> {
  return Layer(IO.failCauseNow(cause));
}

/**
 * @tsplus static fncts.io.LayerOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): Layer<never, E, never> {
  return Layer(IO.failNow(e));
}

/**
 * @tsplus getter fncts.io.Layer flatten
 */
export function flatten<RIn, E, RIn1, E1, ROut>(
  self: Layer<RIn, E, Layer<RIn1, E1, ROut>>,
  tag: Tag<Layer<RIn1, E1, ROut>>,
  __tsplusTrace?: string,
): Layer<RIn | RIn1, E | E1, ROut> {
  return self.flatMap((environment) => environment.get(tag));
}

/**
 * @tsplus getter fncts.io.Layer fresh
 */
export function fresh<R, E, A>(self: Layer<R, E, A>, __tsplusTrace?: string): Layer<R, E, A> {
  return new Fresh(self);
}

/**
 * @tsplus static fncts.io.LayerOps fromFunction
 */
export function fromFunction<R, A>(
  f: (r: R) => A,
  /** @tsplus implicit local */ tagR: Tag<R>,
  /** @tsplus implicit local */ tagA: Tag<A>,
  __tsplusTrace?: string,
): Layer<R, never, A> {
  return Layer.fromIOEnvironment(IO.serviceWith((service) => Environment.empty.add(f(service), Derive()), Derive()));
}

/**
 * @tsplus static fncts.io.LayerOps fromFunctionIO
 */
export function fromFunctionIO<R, E, A, R1>(
  f: (r: R) => IO<R1, E, A>,
  tagR: Tag<R>,
  tagA: Tag<A>,
  __tsplusTrace?: string,
): Layer<R1 | R, E, A> {
  return Layer.fromIOEnvironment(
    IO.serviceWithIO((service) => f(service).map((a) => Environment.empty.add(a, tagA)), tagR),
  );
}

/**
 * @tsplus static fncts.io.LayerOps fromIOEnvironment
 * @tsplus static fncts.io.LayerOps __call
 */
export function fromIOEnvironment<R, E, A>(io: IO<R, E, Environment<A>>, __tsplusTrace?: string): Layer<R, E, A> {
  return new FromScoped(io, __tsplusTrace);
}

/**
 * @tsplus static fncts.io.LayerOps fromIO
 */
export function fromIO<R, E, A>(resource: IO<R, E, A>, tag: Tag<A>, __tsplusTrace?: string): Layer<R, E, A> {
  return Layer.fromIOEnvironment(resource.map((a) => Environment().add(a, tag)));
}

/**
 * @tsplus static fncts.io.LayerOps fromValue
 */
export function fromValue<A>(value: Lazy<A>, tag: Tag<A>, __tsplusTrace?: string): Layer<never, never, A> {
  return Layer.fromIO(IO.succeed(value), tag);
}

/**
 * @tsplus static fncts.io.LayerOps halt
 */
export function halt(defect: Lazy<unknown>, __tsplusTrace?: string): Layer<never, never, never> {
  return Layer(IO.halt(defect));
}

/**
 * @tsplus static fncts.io.LayerOps haltNow
 */
export function haltNow(defect: unknown, __tsplusTrace?: string): Layer<never, never, never> {
  return Layer(IO.haltNow(defect));
}

/**
 * @tsplus pipeable fncts.io.Layer matchCauseLayer
 */
export function matchCauseLayer<E, ROut, RIn1, E1, ROut1, RIn2, E2, ROut2>(
  failure: (cause: Cause<E>) => Layer<RIn1, E1, ROut1>,
  success: (r: Environment<ROut>) => Layer<RIn2, E2, ROut2>,
  __tsplusTrace?: string,
) {
  return <RIn>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1 | RIn2, E1 | E2, ROut1 | ROut2> => {
    return new Fold(self, failure, success, __tsplusTrace);
  };
}

/**
 * @tsplus pipeable fncts.io.Layer matchLayer
 */
export function matchLayer<E, ROut, RIn1, E1, ROut1, RIn2, E2, ROut2>(
  failure: (e: E) => Layer<RIn1, E1, ROut1>,
  success: (r: Environment<ROut>) => Layer<RIn2, E2, ROut2>,
  __tsplusTrace?: string,
) {
  return <RIn>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1 | RIn2, E1 | E2, ROut1 | ROut2> => {
    return self.matchCauseLayer(
      (cause) => cause.failureOrCause.match({ Left: failure, Right: Layer.failCauseNow }),
      success,
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Layer map
 */
export function map<ROut, ROut1>(f: (r: Environment<ROut>) => Environment<ROut1>, __tsplusTrace?: string) {
  return <RIn, E>(self: Layer<RIn, E, ROut>): Layer<RIn, E, ROut1> => {
    return self.flatMap((a) => Layer.succeedEnvironmentNow(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.io.Layer mapError
 */
export function mapError<E, E1>(f: (e: E) => E1, __tsplusTrace?: string) {
  return <RIn, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn, E1, ROut> => {
    return self.catchAll((e) => Layer.failNow(f(e)));
  };
}

/**
 * @tsplus getter fncts.io.Layer memoize
 */
export function memoize<RIn, E, ROut>(
  self: Layer<RIn, E, ROut>,
  __tsplusTrace?: string,
): URIO<Scope, Layer<RIn, E, ROut>> {
  return IO.serviceWithIO((scope: Scope) => self.build(scope), Scope.Tag).memoize.map((_) => new FromScoped(_));
}

/**
 * @tsplus pipeable fncts.io.Layer orElse
 */
export function orElse<RIn1, E1, ROut1>(that: Layer<RIn1, E1, ROut1>, __tsplusTrace?: string) {
  return <RIn, E, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1, E | E1, ROut | ROut1> => {
    return self.catchAll(() => that);
  };
}

/**
 * @tsplus getter fncts.io.Layer orHalt
 */
export function orHalt<RIn, E, ROut>(self: Layer<RIn, E, ROut>, __tsplusTrace?: string): Layer<RIn, never, ROut> {
  return self.catchAll(Layer.haltNow);
}

/**
 * @tsplus getter fncts.io.Layer passthrough
 */
export function passthrough<RIn extends Spreadable, E, ROut extends Spreadable>(
  self: Layer<RIn, E, ROut>,
  __tsplusTrace?: string,
): Layer<RIn, E, RIn & ROut> {
  return Layer.environment<RIn>().and(self);
}

/**
 * @tsplus pipeable fncts.io.Layer retry
 */
export function retry<E, S, RIn1>(schedule: Schedule.WithState<S, RIn1, E, any>, __tsplusTrace?: string) {
  return <RIn, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1, E, ROut> => {
    const tag = Tag<{
      readonly state: S;
    }>("fncts.io.Layer.retryState");
    return Layer.succeedNow({ state: schedule.initial }, tag).flatMap((environment) =>
      retryLoop(self, schedule, environment.get(tag).state, tag),
    );
  };
}

function retryUpdate<S, RIn, E, X>(
  schedule: Schedule.WithState<S, RIn, E, X>,
  e: E,
  s: S,
  tag: Tag<{
    readonly state: S;
  }>,
  __tsplusTrace?: string,
): Layer<
  RIn,
  E,
  {
    readonly state: S;
  }
> {
  return Layer.fromIO(
    Clock.currentTime.flatMap((now) =>
      schedule
        .step(now, e, s)
        .flatMap(([state, _, decision]) =>
          decision._tag === DecisionTag.Done
            ? IO.failNow(e)
            : Clock.sleep(Duration.fromInterval(now, decision.interval.start)).as({ state }),
        ),
    ),
    tag,
  );
}

function retryLoop<RIn, E, ROut, S, RIn1, X>(
  self: Layer<RIn, E, ROut>,
  schedule: Schedule.WithState<S, RIn1, E, X>,
  s: S,
  tag: Tag<{
    readonly state: S;
  }>,
  __tsplusTrace?: string,
): Layer<RIn | RIn1, E, ROut> {
  return self.catchAll((e) =>
    retryUpdate(schedule, e, s, tag).flatMap((env) => retryLoop(self, schedule, env.get(tag).state, tag).fresh),
  );
}

/**
 * @tsplus static fncts.io.LayerOps scopedDiscard
 */
export function scopedDiscard<R, E, A>(
  io: Lazy<IO<R, E, A>>,
  __tsplusTrace?: string,
): Layer<Exclude<R, Scope>, E, never> {
  return Layer.scopedEnvironment(io().as(Environment.empty));
}

/**
 * @tsplus static fncts.io.LayerOps scoped
 */
export function scoped<R, E, A>(
  io: Lazy<IO<R, E, A>>,
  tag: Tag<A>,
  __tsplusTrace?: string,
): Layer<Exclude<R, Scope>, E, A> {
  return Layer.scopedEnvironment(io().map((a) => Environment.empty.add(a, tag)));
}

/**
 * @tsplus static fncts.io.LayerOps scopedEnvironment
 */
export function scopedEnvironment<R, E, A>(
  io: Lazy<IO<R, E, Environment<A>>>,
  __tsplusTrace?: string,
): Layer<Exclude<R, Scope>, E, A> {
  return new FromScoped(IO.defer(io), __tsplusTrace);
}

/**
 * @tsplus static fncts.io.LayerOps service
 */
export function service<A>(tag: Tag<A>, __tsplusTrace?: string): Layer<A, never, A> {
  return Layer.fromIO(IO.service(tag), tag);
}

/**
 * @tsplus static fncts.io.LayerOps succeed
 */
export function succeed<A>(resource: Lazy<A>, tag: Tag<A>, __tsplusTrace?: string): Layer<never, never, A> {
  return Layer.fromIOEnvironment(IO.succeed(Environment.empty.add(resource(), tag)));
}

/**
 * @tsplus static fncts.io.LayerOps succeedEnvironment
 */
export function succeedEnvironment<A>(a: Lazy<Environment<A>>, __tsplusTrace?: string): Layer<never, never, A> {
  return Layer.fromIOEnvironment(IO.succeed(a));
}

/**
 * @tsplus static fncts.io.LayerOps succeedEnvironmentNow
 */
export function succeedEnvironmentNow<A>(a: Environment<A>, __tsplusTrace?: string): Layer<never, never, A> {
  return Layer.fromIOEnvironment(IO.succeedNow(a));
}

/**
 * @tsplus static fncts.io.LayerOps succeedNow
 */
export function succeedNow<A>(resource: A, tag: Tag<A>, __tsplusTrace?: string): Layer<never, never, A> {
  return Layer.fromIOEnvironment(IO.succeedNow(Environment.empty.add(resource, tag)));
}

/**
 * @tsplus pipeable fncts.io.Layer to
 */
export function to<RIn1, E1, ROut1>(
  that: Layer<RIn1, E1, ROut1>,
): <RIn, E, ROut>(self: Layer<RIn, E, ROut>) => Layer<RIn | Exclude<RIn1, ROut>, E | E1, ROut1>;
export function to<ROut, RIn1, E1, ROut1>(that: Layer<ROut | RIn1, E1, ROut1>, __tsplusTrace?: string) {
  return <RIn, E>(self: Layer<RIn, E, ROut>): Layer<RIn | RIn1, E | E1, ROut1> => {
    return new To(Layer(IO.environment<RIn1>(), __tsplusTrace).and(self), that);
  };
}

/**
 * @tsplus pipeable fncts.io.Layer using
 */
export function using<RIn, E, ROut>(
  that: Layer<RIn, E, ROut>,
): <RIn1, E1, ROut1>(self: Layer<RIn1, E1, ROut1>) => Layer<RIn | Exclude<RIn1, ROut>, E | E1, ROut1>;
export function using<RIn, E, ROut>(that: Layer<RIn, E, ROut>, __tsplusTrace?: string) {
  return <RIn1, E1, ROut1>(self: Layer<ROut | RIn1, E1, ROut1>): Layer<RIn | RIn1, E | E1, ROut1> => {
    return new To(Layer(IO.environment<RIn1>(), __tsplusTrace).and(that), self);
  };
}

/**
 * @tsplus getter fncts.io.Layer toRuntime
 */
export function toRuntime<RIn, E, ROut>(self: Layer<RIn, E, ROut>): IO<RIn | Scope, E, Runtime<ROut>> {
  return IO.scopeWith((scope) => self.build(scope)).flatMap((environment) =>
    IO.runtime<ROut>().provideEnvironment(environment),
  );
}
