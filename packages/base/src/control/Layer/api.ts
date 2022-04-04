import type { Spreadable } from "@fncts/base/types";
import type { Erase } from "@fncts/typelevel/Intersection";

import { Fold, Fresh, FromScoped, Layer, To, ZipWithC } from "@fncts/base/control/Layer/definition";
import { DecisionTag } from "@fncts/base/control/Schedule";
import { identity } from "@fncts/base/data/function";

/**
 * @tsplus fluent fncts.control.Layer and
 */
export function and_<RIn, E, ROut extends Spreadable, RIn1, E1, ROut1 extends Spreadable>(
  self: Layer<RIn, E, ROut>,
  that: Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut & ROut1> {
  return new ZipWithC(self, that, (a, b) => ({ ...a, ...b }));
}

/**
 * Feeds the output services of this layer into the input of the specified
 * layer, resulting in a new layer with the inputs of this layer, and the
 * outputs of both layers.
 *
 * @tsplus fluent fncts.control.Layer andTo
 */
export function andTo_<
  RIn,
  E,
  ROut extends Spreadable,
  RIn1 extends Spreadable,
  E1,
  ROut1 extends Spreadable,
>(
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
 * @tsplus fluent fncts.control.Layer andTo
 */
export function andUsing_<
  RIn,
  E,
  ROut extends Spreadable,
  RIn1 extends Spreadable,
  E1,
  ROut1 extends Spreadable,
>(
  self: Layer<RIn1, E1, ROut1>,
  that: Layer<RIn, E, ROut>,
): Layer<RIn & Erase<ROut & RIn1, ROut>, E | E1, ROut & ROut1> {
  return that.and(that.to(self));
}

/**
 * @tsplus fluent fncts.control.Layer catchAll
 */
export function catchAll_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  f: (e: E) => Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E1, ROut | ROut1> {
  return self.matchLayer(f, Layer.succeedNow);
}

/**
 * @tsplus fluent fncts.control.Layer chain
 */
export function chain_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  f: (r: ROut) => Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut1> {
  return self.matchLayer(Layer.failNow, f);
}

/**
 * @tsplus fluent fncts.control.Layer compose
 */
export function compose_<RIn, E, ROut, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<ROut, E1, ROut1>,
): Layer<RIn, E | E1, ROut1> {
  return new To(self, that);
}

/**
 * @tsplus static fncts.control.LayerOps environment
 */
export function environment<RIn>(): Layer<RIn, never, RIn> {
  return Layer(IO.environment<RIn>());
}

/**
 * @tsplus static fncts.control.LayerOps fail
 */
export function fail<E>(e: Lazy<E>): Layer<unknown, E, never> {
  return Layer(IO.fail(e));
}

/**
 * @tsplus static fncts.control.LayerOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>): Layer<unknown, E, never> {
  return Layer(IO.failCause(cause));
}

/**
 * @tsplus static fncts.control.LayerOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>): Layer<unknown, E, never> {
  return Layer(IO.failCauseNow(cause));
}

/**
 * @tsplus static fncts.control.LayerOps failNow
 */
export function failNow<E>(e: E): Layer<unknown, E, never> {
  return Layer(IO.failNow(e));
}

/**
 * @tsplus getter fncts.control.Layer flatten
 */
export function flatten<RIn, E, RIn1, E1, ROut>(
  self: Layer<RIn, E, Layer<RIn1, E1, ROut>>,
): Layer<RIn & RIn1, E | E1, ROut> {
  return self.chain(identity);
}

/**
 * @tsplus getter fncts.control.Layer fresh
 */
export function fresh<R, E, A>(self: Layer<R, E, A>): Layer<R, E, A> {
  return new Fresh(self);
}

/**
 * @tsplus static fncts.control.LayerOps fromFunction
 */
export function fromFunction<A>(tag: Tag<A>) {
  return <R>(f: (r: R) => A): Layer<R, never, Has<A>> => Layer.fromIO(tag)(IO.environmentWith(f));
}

/**
 * @tsplus static fncts.control.LayerOps fromFunctionIO
 */
export function fromFunctionIO<A>(tag: Tag<A>) {
  return <R, R1, E>(f: (r: R) => IO<R1, E, A>): Layer<R & R1, E, Has<A>> =>
    Layer.fromIO(tag)(IO.environmentWithIO(f));
}

/**
 * @tsplus static fncts.control.LayerOps fromIOEnvironment
 * @tsplus static fncts.control.LayerOps __call
 */
export function fromIOEnvironment<R, E, A>(
  io: IO<R, E, A>,
  __tsplusTrace?: string,
): Layer<R, E, A> {
  return new FromScoped(io);
}

/**
 * @tsplus static fncts.control.LayerOps fromIO
 */
export function fromIO<A>(tag: Tag<A>) {
  return <R, E>(resource: IO<R, E, A>): Layer<R, E, Has<A>> =>
    Layer.fromIOEnvironment(resource.chain((a) => environmentFor(tag, a)));
}

/**
 * @tsplus static fncts.control.LayerOps fromRawFunction
 */
export function fromRawFunction<R, A>(f: (r: R) => A): Layer<R, never, A> {
  return Layer.fromRawIO(IO.environmentWith(f));
}

/**
 * @tsplus static fncts.control.LayerOps fromRawFunctionIO
 */
export function fromRawFunctionIO<R, R1, E, A>(f: (r: R) => IO<R1, E, A>): Layer<R & R1, E, A> {
  return Layer.fromRawIO(IO.environmentWithIO(f));
}

/**
 * @tsplus static fncts.control.LayerOps fromRawIO
 */
export function fromRawIO<R, E, A>(resource: IO<R, E, A>): Layer<R, E, A> {
  return Layer(resource);
}

/**
 * @tsplus static fncts.control.LayerOps fromValue
 */
export function fromValue<A>(tag: Tag<A>) {
  return (value: Lazy<A>): Layer<unknown, never, Has<A>> => Layer.fromIO(tag)(IO.succeed(value));
}

/**
 * @tsplus static fncts.control.LayerOps halt
 */
export function halt(defect: Lazy<unknown>): Layer<unknown, never, never> {
  return Layer(IO.halt(defect));
}

/**
 * @tsplus static fncts.control.LayerOps haltNow
 */
export function haltNow(defect: unknown): Layer<unknown, never, never> {
  return Layer(IO.haltNow(defect));
}

/**
 * @tsplus fluent fncts.control.Layer matchCauseLayer
 */
export function matchCauseLayer_<RIn, E, ROut, RIn1, E1, ROut1, RIn2, E2, ROut2>(
  self: Layer<RIn, E, ROut>,
  failure: (cause: Cause<E>) => Layer<RIn1, E1, ROut1>,
  success: (r: ROut) => Layer<RIn2, E2, ROut2>,
): Layer<RIn & RIn1 & RIn2, E1 | E2, ROut1 | ROut2> {
  return new Fold(self, failure, success);
}

/**
 * @tsplus fluent fncts.control.Layer matchLayer
 */
export function matchLayer_<RIn, E, ROut, RIn1, E1, ROut1, RIn2, E2, ROut2>(
  self: Layer<RIn, E, ROut>,
  failure: (e: E) => Layer<RIn1, E1, ROut1>,
  success: (r: ROut) => Layer<RIn2, E2, ROut2>,
): Layer<RIn & RIn1 & RIn2, E1 | E2, ROut1 | ROut2> {
  return self.matchCauseLayer(
    (cause) => cause.failureOrCause.match(failure, Layer.failCauseNow),
    success,
  );
}

/**
 * @tsplus fluent fncts.control.Layer map
 */
export function map_<RIn, E, ROut, ROut1>(
  self: Layer<RIn, E, ROut>,
  f: (r: ROut) => ROut1,
): Layer<RIn, E, ROut1> {
  return self.chain((a) => Layer.succeedNow(f(a)));
}

/**
 * @tsplus fluent fncts.control.Layer mapError
 */
export function mapError_<RIn, E, ROut, E1>(
  self: Layer<RIn, E, ROut>,
  f: (e: E) => E1,
): Layer<RIn, E1, ROut> {
  return self.catchAll((e) => Layer.failNow(f(e)));
}

/**
 * @tsplus getter fncts.control.Layer memoize
 */
export function memoize<RIn, E, ROut>(
  self: Layer<RIn, E, ROut>,
): URIO<Has<Scope>, Layer<RIn, E, ROut>> {
  return IO.serviceWithIO(Scope.Tag)((scope) => self.build(scope)).memoize.map(
    (_) => new FromScoped(_),
  );
}

/**
 * @tsplus fluent fncts.control.Layer orElse
 */
export function orElse_<RIn, E, ROut, RIn1, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut | ROut1> {
  return self.catchAll(() => that);
}

/**
 * @tsplus getter fncts.control.Layer orHalt
 */
export function orHalt<RIn, E, ROut>(self: Layer<RIn, E, ROut>): Layer<RIn, never, ROut> {
  return self.catchAll(Layer.haltNow);
}

/**
 * @tsplus getter fncts.control.Layer passthrough
 */
export function passthrough<RIn extends Spreadable, E, ROut extends Spreadable>(
  self: Layer<RIn, E, ROut>,
): Layer<RIn, E, RIn & ROut> {
  return Layer.environment<RIn>().and(self);
}

/**
 * @tsplus fluent fncts.control.Layer retry
 */
export function retry_<RIn, E, ROut, S, RIn1>(
  self: Layer<RIn, E, ROut>,
  schedule: Schedule.WithState<S, RIn1, E, any>,
): Layer<RIn & RIn1 & Has<Clock>, E, ROut> {
  return Layer.succeedNow({ state: schedule.initial }).chain(({ state }) =>
    retryLoop(self, schedule, state),
  );
}

function retryUpdate<S, RIn, E, X>(
  schedule: Schedule.WithState<S, RIn, E, X>,
  e: E,
  s: S,
): Layer<RIn & Has<Clock>, E, { readonly state: S }> {
  return Layer.fromRawIO(
    Clock.currentTime.chain((now) =>
      schedule
        .step(now, e, s)
        .chain(([state, _, decision]) =>
          decision._tag === DecisionTag.Done
            ? IO.failNow(e)
            : Clock.sleep(decision.interval.startMilliseconds - now).as({ state }),
        ),
    ),
  );
}

function retryLoop<RIn, E, ROut, S, RIn1, X>(
  self: Layer<RIn, E, ROut>,
  schedule: Schedule.WithState<S, RIn1, E, X>,
  s: S,
): Layer<RIn & RIn1 & Has<Clock>, E, ROut> {
  return self.catchAll((e) =>
    retryUpdate(schedule, e, s).chain((env) => retryLoop(self, schedule, env.state).fresh),
  );
}

/**
 * @tsplus static fncts.control.LayerOps scoped
 */
export function scoped<A>(tag: Tag<A>) {
  return <R, E>(io: Lazy<IO<R & Has<Scope>, E, A>>): Layer<R, E, Has<A>> =>
    Layer.scopedEnvironment(IO.defer(io).chain((a) => environmentFor(tag, a)));
}

/**
 * @tsplus static fncts.control.LayerOps scopedEnvironment
 */
export function scopedEnvironment<R, E, A>(io: Lazy<IO<R & Has<Scope>, E, A>>): Layer<R, E, A> {
  return new FromScoped(IO.defer(io));
}

/**
 * @tsplus static fncts.control.LayerOps service
 */
export function service<A>(tag: Tag<A>): Layer<Has<A>, never, A> {
  return Layer(IO.service(tag));
}

/**
 * @tsplus static fncts.control.LayerOps succeed
 */
export function succeed<A>(resource: Lazy<A>): Layer<unknown, never, A> {
  return Layer(IO.succeed(resource));
}

/**
 * @tsplus static fncts.control.LayerOps succeedNow
 */
export function succeedNow<A>(resource: A): Layer<unknown, never, A> {
  return Layer(IO.succeedNow(resource));
}

/**
 * @tsplus fluent fncts.control.Layer to
 */
export function to_<RIn, E, ROut, RIn1 extends Spreadable, E1, ROut1 extends Spreadable>(
  self: Layer<RIn, E, ROut>,
  that: Layer<RIn1, E1, ROut1>,
): Layer<RIn & Erase<RIn1, ROut>, E | E1, ROut1>;
export function to_<RIn, E, ROut extends Spreadable, RIn1 extends Spreadable, E1, ROut1>(
  self: Layer<RIn, E, ROut>,
  that: Layer<ROut & RIn1, E1, ROut1>,
): Layer<RIn & RIn1, E | E1, ROut1> {
  return new To(Layer(IO.environment<RIn1>()).and(self), that);
}

/**
 * @tsplus fluent fncts.control.Layer using
 */
export function using_<RIn, E, ROut, RIn1 extends Spreadable, E1, ROut1 extends Spreadable>(
  self: Layer<RIn1, E1, ROut1>,
  that: Layer<RIn, E, ROut>,
): Layer<RIn & Erase<RIn1, ROut>, E | E1, ROut1>;
export function using_<RIn, E, ROut extends Spreadable, RIn1 extends Spreadable, E1, ROut1>(
  self: Layer<ROut & RIn1, E1, ROut1>,
  that: Layer<RIn, E, ROut>,
): Layer<RIn & RIn1, E | E1, ROut1> {
  return new To(Layer(IO.environment<RIn1>()).and(that), self);
}

function environmentFor<A>(tag: Tag<A>, a: A): IO<unknown, never, Has<A>> {
  return IO.environmentWith(
    (r) =>
      ({
        [tag.key]: tag.mergeEnvironments(r, a)[tag.key],
      } as Has<A>),
  );
}
