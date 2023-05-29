import type { Eq } from "@fncts/base/typeclass";

import { identity } from "@fncts/base/data/function";

import { AssertionData } from "../../data/AssertionData.js";
import { AssertionValue } from "../../data/AssertionValue.js";
import { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra.js";
import { Render } from "../../data/Render.js";
import { RenderParam } from "../../data/RenderParam.js";
import { Assertion } from "./definition.js";

/**
 * @tsplus pipeable fncts.test.Assertion and
 * @tsplus pipeable-operator fncts.test.Assertion &&
 */
export function and<A>(that: Assertion<A>) {
  return (self: Assertion<A>): Assertion<A> => {
    return new Assertion(
      Render.infix(RenderParam(self), "&&", RenderParam(that)),
      (actual) => self.run(actual) && that.run(actual),
    );
  };
}

/**
 * @tsplus static fncts.test.AssertionOps anything
 */
export const anything: Assertion<any> = Assertion.make("anything", [], () => true);

/**
 * @tsplus static fncts.test.AssertionOps approximatelyEquals
 */
export function approximatelyEquals(reference: number, tolerance: number): Assertion<number> {
  return Assertion.make("approximatelyEquals", [RenderParam(reference), RenderParam(tolerance)], (actual) => {
    const max = reference + tolerance;
    const min = reference - tolerance;
    return actual >= min && actual <= max;
  });
}

/**
 * @tsplus static fncts.test.AssertionOps make
 */
export function assertion<A>(
  name: string,
  params: ReadonlyArray<RenderParam>,
  run: (actual: A) => boolean,
): Assertion<A> {
  const assertion: LazyValue<Assertion<A>> = LazyValue(() => {
    return Assertion.direct(name, params, (actual) => {
      const result: LazyValue<FreeBooleanAlgebra<AssertionValue<A>>> = LazyValue(() => {
        if (run(actual)) {
          return FreeBooleanAlgebra.success(new AssertionValue(assertion, actual, result));
        } else {
          return FreeBooleanAlgebra.failure(new AssertionValue(assertion, actual, result));
        }
      });
      return result.value;
    });
  });
  return assertion.value;
}

/**
 * @tsplus static fncts.test.AssertionOps direct
 */
export function assertionDirect<A>(
  name: string,
  params: ReadonlyArray<RenderParam>,
  run: (actual: A) => FreeBooleanAlgebra<AssertionValue<A>>,
): Assertion<A> {
  return new Assertion(Render.fn(name, Conc.single(Conc.from(params))), run);
}

/**
 * @tsplus static fncts.test.AssertionOps rec
 */
export function assertionRec<A, B>(
  name: string,
  params: ReadonlyArray<RenderParam>,
  assertion: Assertion<B>,
  get: (a: A) => Maybe<B>,
  orElse: (data: AssertionData<A>) => FreeBooleanAlgebra<AssertionValue<A>> = (_) => _.asFailure,
): Assertion<A> {
  const resultAssertion: LazyValue<Assertion<A>> = LazyValue(() =>
    Assertion.direct(name, params, (a) =>
      get(a).match(
        () => orElse(new AssertionData(a, resultAssertion.value)),
        (b) => {
          const innerResult = assertion.run(b);
          const result: LazyValue<FreeBooleanAlgebra<AssertionValue<any>>> = LazyValue(() => {
            if (innerResult.isSuccess) {
              return FreeBooleanAlgebra.success(new AssertionValue(resultAssertion, a, result));
            } else {
              return FreeBooleanAlgebra.failure(new AssertionValue(LazyValue(assertion), b, LazyValue(innerResult)));
            }
          });
          return result.value;
        },
      ),
    ),
  );
  return resultAssertion.value;
}

export function contains<A>(element: A): Assertion<Iterable<A>> {
  return Assertion.make("contains", [RenderParam(element)], (ia) =>
    ia.find((a) => Equatable.deepEquals(a, element)).isJust(),
  );
}

export function containsCause<E>(cause: Cause<E>): Assertion<Cause<E>> {
  return Assertion.make("containsCause", [RenderParam(cause)], (c) => c.contains(cause));
}

export function containsString(element: string): Assertion<string> {
  return Assertion.make("containsString", [RenderParam(element)], (str) => str.includes(element));
}

export function some<A>(assertion: Assertion<A>): Assertion<Iterable<A>> {
  return Assertion.rec("some", [RenderParam(assertion)], assertion, (ia) => ia.find((a) => assertion.test(a)));
}

export function fails<E>(assertion: Assertion<E>): Assertion<Exit<any, any>> {
  return Assertion.rec("fails", [RenderParam(assertion)], assertion, (exit) =>
    exit.match(
      (cause) => cause.failures.head,
      () => Nothing(),
    ),
  );
}

/**
 * @tsplus getter fncts.test.Assertion every
 */
export function every<A>(assertion: Assertion<A>): Assertion<Iterable<A>> {
  return Assertion.rec(
    "every",
    [RenderParam(assertion)],
    assertion,
    (ia) => ia.find((a) => !assertion.test(a)),
    (data) => data.asSuccess,
  );
}

export function halts(assertion: Assertion<any>): Assertion<Exit<any, any>> {
  return Assertion.rec("halts", [RenderParam(assertion)], assertion, (exit) =>
    exit.match(
      (c) => c.haltMaybe,
      () => Nothing(),
    ),
  );
}

export function strictEqualTo(expected: unknown): Assertion<unknown> {
  return Assertion.make("strictEqualTo", [RenderParam(expected)], (actual) => Equatable.strictEquals(actual, expected));
}

export function deepEqualTo<A>(expected: A): Assertion<A> {
  return Assertion.make("deepEqualTo", [RenderParam(expected)], (actual) => Equatable.deepEquals(actual, expected));
}

export function equals<A>(expected: A, E: Eq<A>): Assertion<A> {
  return Assertion.make("equals", [RenderParam(expected)], E.equals(expected));
}

export const isFalse: Assertion<boolean> = Assertion.make("isFalse", [], (b) => !b);

export const isInterrupted: Assertion<Exit<any, any>> = Assertion.make("isInterrupted", [], (exit) =>
  exit.match(
    (cause) => cause.interrupted,
    () => false,
  ),
);

export const isOnlyInterrupted: Assertion<Exit<any, any>> = Assertion.make("isOnlyInterrupted", [], (exit) =>
  exit.match(
    (cause) => cause.isInterrupt(),
    () => false,
  ),
);

export function isLeft<A>(assertion: Assertion<A>): Assertion<Either<A, any>> {
  return Assertion.rec("isLeft", [RenderParam(assertion)], assertion, (actual) =>
    actual.match({
      Left: (a) => Just(a),
      Right: () => Nothing(),
    }),
  );
}

export function isJust<A>(assertion: Assertion<A>): Assertion<Maybe<A>> {
  return Assertion.rec("isJust", [RenderParam(assertion)], assertion, identity);
}

export const isNothing: Assertion<Maybe<any>> = Assertion.make("isNothing", [], (actual) => actual.isNothing());

export function isRight<A>(assertion: Assertion<A>): Assertion<Either<any, A>> {
  return Assertion.rec("isRight", [RenderParam(assertion)], assertion, (actual) =>
    actual.match({
      Left: () => Nothing(),
      Right: (a) => Just(a),
    }),
  );
}

export const isTrue: Assertion<boolean> = Assertion.make("isTrue", [], identity);

export const isEmpty: Assertion<Iterable<any>> = Assertion.make("isEmpty", [], (actual) => actual.size === 0);

export const isUnit: Assertion<void> = Assertion.make("isUnit", [], (actual) => actual === void 0);

export function isLessThanOrEqualTo(n: number): Assertion<number> {
  return Assertion.make("isLessThanOrEqualTo", [RenderParam(n)], (actual) => actual <= n);
}

/**
 * @tsplus pipeable fncts.test.Assertion label
 */
export function label(label: string) {
  return <A>(self: Assertion<A>): Assertion<A> => {
    return new Assertion(Render.infix(RenderParam(self), ":", RenderParam(label)), self.run);
  };
}

/**
 * @tsplus getter fncts.test.Assertion invert
 */
export function not<A>(assertion: Assertion<A>): Assertion<A> {
  return Assertion.direct("not", [RenderParam(assertion)], (actual) => assertion.run(actual).invert);
}

/**
 * @tsplus pipeable fncts.test.Assertion or
 * @tsplus pipeable-operator fncts.test.Assertion ||
 */
export function or<A>(that: Assertion<A>) {
  return (self: Assertion<A>): Assertion<A> => {
    return new Assertion(
      Render.infix(RenderParam(self), "||", RenderParam(that)),
      (actual) => self.run(actual) || that.run(actual),
    );
  };
}

/**
 * @tsplus getter fncts.test.Assertion succeeds
 */
export function succeeds<A>(assertion: Assertion<A>): Assertion<Exit<any, A>> {
  return Assertion.rec("succeeds", [RenderParam(assertion)], assertion, (exit) =>
    exit.match(
      () => Nothing(),
      (a) => Just(a),
    ),
  );
}

/**
 * @tsplus pipeable fncts.test.Assertion test
 */
export function test<A>(actual: A) {
  return (self: Assertion<A>): boolean => {
    return self.run(actual).isSuccess;
  };
}

export const completes = Assertion.make("completes", [], () => true);
