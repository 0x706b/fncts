import type { Spreadable } from "@fncts/base/types";
import type { Erase } from "@fncts/typelevel/Intersection";

import { Fold, Fresh, FromScoped, Layer, To, ZipWithC } from "@fncts/io/Layer/definition";
import { DecisionTag } from "@fncts/io/Schedule";

/**
 * @tsplus fluent fncts.io.Layer and
 */
export function and_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut & ROut1> {
  return new ZipWithC(self, that, (a, b) => a.union(b));
}

/**
 * Feeds the output services of this layer into the input of the specified
 * layer, resulting in a new layer with the inputs of this layer, and the
 * outputs of both layers.
 *
 * @tsplus fluent fncts.io.Layer andTo
 */
export function andTo_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<RIn1, E1, ROut1>,
): Layer<RIn & Erase<ROut & RIn1, ROut>, E | E1, ROut & ROut1> {
  return self.and(self.to(that));
}

/**
 * Feeds the output services of this layer into the input of the specified
 * layer, resulting in a new layer with the inputs of this layer, and the
 * outputs of both layers.
 *
 * @tsplus fluent fncts.io.Layer andTo
 */
export function andUsing_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn1, E1, ROut1>,
  that: Layer<RIn, E, ROut>,
): Layer<RIn & Erase<ROut & RIn1, ROut>, E | E1, ROut & ROut1> {
  return that.and(that.to(self));
}

/**
 * @tsplus fluent fncts.io.Layer catchAll
 */
export function catchAll_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  f: (e: E) => Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E1, ROut | ROut1> {
  return self.matchLayer(f, Layer.succeedEnvironmentNow);
}

/**
 * @tsplus fluent fncts.io.Layer flatMap
 */
export function flatMap_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  f: (r: Environment<ROut>) => Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut1> {
  return self.matchLayer(Layer.failNow, f);
}

/**
 * @tsplus fluent fncts.io.Layer compose
 */
export function compose_<RIn, E, ROut, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<ROut, E1, ROut1>,
): Layer<RIn, E | E1, ROut1> {
  return new To(self, that);
}

/**
 * @tsplus static fncts.io.LayerOps environment
 */
export function environment<RIn>(): Layer<RIn, never, RIn> {
  return Layer(IO.environment<RIn>());
}

/**
 * @tsplus static fncts.io.LayerOps fail
 */
export function fail<E>(e: Lazy<E>): Layer<unknown, E, never> {
  return Layer(IO.fail(e));
}

/**
 * @tsplus static fncts.io.LayerOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>): Layer<unknown, E, never> {
  return Layer(IO.failCause(cause));
}

/**
 * @tsplus static fncts.io.LayerOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>): Layer<unknown, E, never> {
  return Layer(IO.failCauseNow(cause));
}

/**
 * @tsplus static fncts.io.LayerOps failNow
 */
export function failNow<E>(e: E): Layer<unknown, E, never> {
  return Layer(IO.failNow(e));
}

/**
 * @tsplus getter fncts.io.Layer flatten
 */
export function flatten<RIn, E, RIn1, E1, ROut>(
  self: Layer<RIn, E, Has<Layer<RIn1, E1, ROut>>>,
  tag: Tag<Layer<RIn1, E1, ROut>>,
): Layer<RIn & RIn1, E | E1, ROut> {
  return self.flatMap((environment) => environment.get(tag));
}

/**
 * @tsplus getter fncts.io.Layer fresh
 */
export function fresh<R, E, A>(self: Layer<R, E, A>): Layer<R, E, A> {
  return new Fresh(self);
}

/**
 * @tsplus static fncts.io.LayerOps fromFunction
 */
export function fromFunction<R, A>(
  f: (r: R) => A,
  /** @tsplus implicit local */ tagR: Tag<R>,
  /** @tsplus implicit local */ tagA: Tag<A>,
): Layer<Has<R>, never, Has<A>> {
  return Layer.fromIOEnvironment(IO.serviceWith((service) => Environment.empty.add(f(service), Derive()), Derive()));
}

/**
 * @tsplus static fncts.io.LayerOps fromFunctionIO
 */
export function fromFunctionIO<R, E, A, R1>(
  f: (r: R) => IO<R1, E, A>,
  tagR: Tag<R>,
  tagA: Tag<A>,
): Layer<R1 & Has<R>, E, Has<A>> {
  return Layer.fromIOEnvironment(
    IO.serviceWithIO((service) => f(service).map((a) => Environment.empty.add(a, tagA)), tagR),
  );
}

/**
 * @tsplus static fncts.io.LayerOps fromIOEnvironment
 * @tsplus static fncts.io.LayerOps __call
 */
export function fromIOEnvironment<R, E, A>(io: IO<R, E, Environment<A>>, __tsplusTrace?: string): Layer<R, E, A> {
  return new FromScoped(io);
}

/**
 * @tsplus static fncts.io.LayerOps fromIO
 */
export function fromIO<R, E, A>(resource: IO<R, E, A>, tag: Tag<A>): Layer<R, E, Has<A>> {
  return Layer.fromIOEnvironment(resource.map((a) => Environment().add(a, tag)));
}

/**
 * @tsplus static fncts.io.LayerOps fromValue
 */
export function fromValue<A>(value: Lazy<A>, tag: Tag<A>): Layer<unknown, never, Has<A>> {
  return Layer.fromIO(IO.succeed(value), tag);
}

/**
 * @tsplus static fncts.io.LayerOps halt
 */
export function halt(defect: Lazy<unknown>): Layer<unknown, never, never> {
  return Layer(IO.halt(defect));
}

/**
 * @tsplus static fncts.io.LayerOps haltNow
 */
export function haltNow(defect: unknown): Layer<unknown, never, never> {
  return Layer(IO.haltNow(defect));
}

/**
 * @tsplus fluent fncts.io.Layer matchCauseLayer
 */
export function matchCauseLayer_<RIn, E, ROut, RIn1, E1, ROut1, RIn2, E2, ROut2>(
  self: Layer<RIn, E, ROut>,
  failure: (cause: Cause<E>) => Layer<RIn1, E1, ROut1>,
  success: (r: Environment<ROut>) => Layer<RIn2, E2, ROut2>,
): Layer<RIn & RIn1 & RIn2, E1 | E2, ROut1 | ROut2> {
  return new Fold(self, failure, success);
}

/**
 * @tsplus fluent fncts.io.Layer matchLayer
 */
export function matchLayer_<RIn, E, ROut, RIn1, E1, ROut1, RIn2, E2, ROut2>(
  self: Layer<RIn, E, ROut>,
  failure: (e: E) => Layer<RIn1, E1, ROut1>,
  success: (r: Environment<ROut>) => Layer<RIn2, E2, ROut2>,
): Layer<RIn & RIn1 & RIn2, E1 | E2, ROut1 | ROut2> {
  return self.matchCauseLayer((cause) => cause.failureOrCause.match(failure, Layer.failCauseNow), success);
}

/**
 * @tsplus fluent fncts.io.Layer map
 */
export function map_<RIn, E, ROut, ROut1>(
  self: Layer<RIn, E, ROut>,
  f: (r: Environment<ROut>) => Environment<ROut1>,
): Layer<RIn, E, ROut1> {
  return self.flatMap((a) => Layer.succeedEnvironmentNow(f(a)));
}

/**
 * @tsplus fluent fncts.io.Layer mapError
 */
export function mapError_<RIn, E, ROut, E1>(self: Layer<RIn, E, ROut>, f: (e: E) => E1): Layer<RIn, E1, ROut> {
  return self.catchAll((e) => Layer.failNow(f(e)));
}

/**
 * @tsplus getter fncts.io.Layer memoize
 */
export function memoize<RIn, E, ROut>(self: Layer<RIn, E, ROut>): URIO<Has<Scope>, Layer<RIn, E, ROut>> {
  return IO.serviceWithIO((scope: Scope) => self.build(scope), Scope.Tag).memoize.map((_) => new FromScoped(_));
}

/**
 * @tsplus fluent fncts.io.Layer orElse
 */
export function orElse_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut | ROut1> {
  return self.catchAll(() => that);
}

/**
 * @tsplus getter fncts.io.Layer orHalt
 */
export function orHalt<RIn, E, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn, never, ROut> {
  return self.catchAll(Layer.haltNow);
}

/**
 * @tsplus getter fncts.io.Layer passthrough
 */
export function passthrough<RIn extends Spreadable, E, ROut extends Spreadable>(
  self: Layer<RIn, E, ROut>,
): Layer<RIn, E, RIn & ROut> {
  return Layer.environment<RIn>().and(self);
}

/**
 * @tsplus fluent fncts.io.Layer retry
 */
export function retry_<RIn, E, ROut, S, RIn1>(
  self: Layer<RIn, E, ROut>,
  schedule: Schedule.WithState<S, RIn1, E, any>,
): Layer<RIn & RIn1, E, ROut> {
  const tag = Tag<{ readonly state: S }>();
  return Layer.succeedNow({ state: schedule.initial }, tag).flatMap((environment) =>
    retryLoop(self, schedule, environment.get(tag).state, tag),
  );
}

function retryUpdate<S, RIn, E, X>(
  schedule: Schedule.WithState<S, RIn, E, X>,
  e: E,
  s: S,
  tag: Tag<{ readonly state: S }>,
): Layer<RIn, E, Has<{ readonly state: S }>> {
  return Layer.fromIO(
    Clock.currentTime.flatMap((now) =>
      schedule
        .step(now, e, s)
        .flatMap(([state, _, decision]) =>
          decision._tag === DecisionTag.Done
            ? IO.failNow(e)
            : Clock.sleep(Duration.fromInterval(now, decision.interval.startMilliseconds)).as({ state }),
        ),
    ),
    tag,
  );
}

function retryLoop<RIn, E, ROut, S, RIn1, X>(
  self: Layer<RIn, E, ROut>,
  schedule: Schedule.WithState<S, RIn1, E, X>,
  s: S,
  tag: Tag<{ readonly state: S }>,
): Layer<RIn & RIn1, E, ROut> {
  return self.catchAll((e) =>
    retryUpdate(schedule, e, s, tag).flatMap((env) => retryLoop(self, schedule, env.get(tag).state, tag).fresh),
  );
}

/**
 * @tsplus static fncts.io.LayerOps scoped
 */
export function scoped<R, E, A>(io: Lazy<IO<R & Has<Scope>, E, A>>, tag: Tag<A>): Layer<R, E, Has<A>> {
  return Layer.scopedEnvironment(io().map((a) => Environment.empty.add(a, tag)));
}

/**
 * @tsplus static fncts.io.LayerOps scopedEnvironment
 */
export function scopedEnvironment<R, E, A>(io: Lazy<IO<R & Has<Scope>, E, Environment<A>>>): Layer<R, E, A> {
  return new FromScoped(IO.defer(io));
}

/**
 * @tsplus static fncts.io.LayerOps service
 */
export function service<A>(tag: Tag<A>): Layer<Has<A>, never, Has<A>> {
  return Layer.fromIO(IO.service(tag), tag);
}

/**
 * @tsplus static fncts.io.LayerOps succeed
 */
export function succeed<A>(resource: Lazy<A>, tag: Tag<A>): Layer<unknown, never, Has<A>> {
  return Layer.fromIOEnvironment(IO.succeed(Environment.empty.add(resource(), tag)));
}

/**
 * @tsplus static fncts.io.LayerOps succeedEnvironment
 */
export function succeedEnvironment<A>(a: Lazy<Environment<A>>): Layer<unknown, never, A> {
  return Layer.fromIOEnvironment(IO.succeed(a));
}

/**
 * @tsplus static fncts.io.LayerOps succeedEnvironmentNow
 */
export function succeedEnvironmentNow<A>(a: Environment<A>): Layer<unknown, never, A> {
  return Layer.fromIOEnvironment(IO.succeedNow(a));
}

/**
 * @tsplus static fncts.io.LayerOps succeedNow
 */
export function succeedNow<A>(resource: A, tag: Tag<A>): Layer<unknown, never, Has<A>> {
  return Layer.fromIOEnvironment(IO.succeedNow(Environment.empty.add(resource, tag)));
}

/**
 * @tsplus fluent fncts.io.Layer to
 */
export function to_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<RIn1, E1, ROut1>,
): Layer<RIn & Erase<RIn1, ROut>, E | E1, ROut1>;
export function to_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<ROut & RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut1> {
  return new To(Layer(IO.environment<RIn1>()).and(self), that);
}

/**
 * @tsplus fluent fncts.io.Layer using
 */
export function using_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn1, E1, ROut1>,
  that: Layer<RIn, E, ROut>,
): Layer<RIn & Erase<RIn1, ROut>, E | E1, ROut1>;
export function using_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<ROut & RIn1, E1, ROut1>,
  that: Layer<RIn, E, ROut>,
): Layer<RIn & RIn1, E | E1, ROut1> {
  return new To(Layer(IO.environment<RIn1>()).and(that), self);
}
