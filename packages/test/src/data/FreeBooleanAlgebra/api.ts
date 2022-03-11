import { Eval } from "@fncts/base/control/Eval";
import { Either } from "@fncts/base/data/Either";
import { Maybe, Nothing } from "@fncts/base/data/Maybe";

import { And, FreeBooleanAlgebra, FreeBooleanAlgebraTag, Not, Or, Value } from "./definition";

/**
 * @tsplus fluent fncts.data.FreeBooleanAlgebra and
 * @tsplus operator fncts.data.FreeBooleanAlgebra &&
 */
export function and_<A>(
  left: FreeBooleanAlgebra<A>,
  right: FreeBooleanAlgebra<A>,
): FreeBooleanAlgebra<A> {
  return new And(left, right);
}

/**
 * @tsplus static fncts.data.FreeBooleanAlgebraOps failure
 */
export function failure<A>(a: A): FreeBooleanAlgebra<A> {
  return FreeBooleanAlgebra.success(a).invert;
}

/**
 * @tsplus getter fncts.data.FreeBooleanAlgebra failures
 */
export function failures<A>(self: FreeBooleanAlgebra<A>): Maybe<FreeBooleanAlgebra<A>> {
  return self
    .fold<A, Either<FreeBooleanAlgebra<A>, FreeBooleanAlgebra<A>>>({
      Value: (a) => Either.right(FreeBooleanAlgebra.success(a)),
      And: (l, r) =>
        l.isRight()
          ? r.isRight()
            ? Either.right(l.right && r.right)
            : r
          : r.isRight()
          ? l
          : Either.left(l.left && r.left),
      Or: (l, r) =>
        l.isRight()
          ? r.isRight()
            ? Either.right(l.right || r.right)
            : l
          : r.isRight()
          ? r
          : Either.left(l.left || r.left),
      Not: (v) => v.swap,
    })
    .match(Maybe.just, () => Nothing());
}

/**
 * @tsplus fluent fncts.data.FreeBooleanAlgebra foldEval
 */
export function foldEval_<A, B>(
  self: FreeBooleanAlgebra<A>,
  cases: {
    Value: (value: A) => B;
    And: (left: B, right: B) => B;
    Or: (left: B, right: B) => B;
    Not: (value: B) => B;
  },
): Eval<B> {
  return Eval.defer(() => {
    switch (self._tag) {
      case FreeBooleanAlgebraTag.Value:
        return Eval.now(cases.Value(self.value));
      case FreeBooleanAlgebraTag.And:
        return self.left.foldEval(cases).zipWith(self.right.foldEval(cases), cases.And);
      case FreeBooleanAlgebraTag.Or:
        return self.left.foldEval(cases).zipWith(self.right.foldEval(cases), cases.Or);
      case FreeBooleanAlgebraTag.Not:
        return self.result.foldEval(cases).map(cases.Not);
    }
  });
}

/**
 * @tsplus fluent fncts.data.FreeBooleanAlgebra fold
 */
export function fold_<A, B>(
  self: FreeBooleanAlgebra<A>,
  cases: {
    Value: (value: A) => B;
    And: (left: B, right: B) => B;
    Or: (left: B, right: B) => B;
    Not: (value: B) => B;
  },
): B {
  return self.foldEval(cases).run;
}

/**
 * @tsplus fluent fncts.data.FreeBooleanAlgebra iff
 */
export function iff_<A>(
  left: FreeBooleanAlgebra<A>,
  right: FreeBooleanAlgebra<A>,
): FreeBooleanAlgebra<A> {
  return left.implies(right) && right.implies(left);
}

/**
 * @tsplus fluent fncts.data.FreeBooleanAlgebra implies
 */
export function implies_<A>(
  left: FreeBooleanAlgebra<A>,
  right: FreeBooleanAlgebra<A>,
): FreeBooleanAlgebra<A> {
  return left.invert || right;
}

/**
 * @tsplus getter fncts.data.FreeBooleanAlgebra isFailure
 */
export function isFailure<A>(self: FreeBooleanAlgebra<A>): boolean {
  return !self.isSuccess;
}

/**
 * @tsplus getter fncts.data.FreeBooleanAlgebra isSuccess
 */
export function isSuccess<A>(self: FreeBooleanAlgebra<A>): boolean {
  return self.fold({
    Value: (): boolean => true,
    And: (l, r) => l && r,
    Or: (l, r) => l || r,
    Not: (v) => !v,
  });
}

/**
 * @tsplus getter fncts.data.FreeBooleanAlgebra invert
 */
export function not<A>(self: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<A> {
  return new Not(self);
}

/**
 * @tsplus fluent fncts.data.FreeBooleanAlgebra or
 * @tsplus operator fncts.data.FreeBooleanAlgebra ||
 */
export function or_<A>(
  left: FreeBooleanAlgebra<A>,
  right: FreeBooleanAlgebra<A>,
): FreeBooleanAlgebra<A> {
  return new Or(left, right);
}

/**
 * @tsplus static fncts.data.FreeBooleanAlgebraOps success
 */
export function success<A>(a: A): FreeBooleanAlgebra<A> {
  return new Value(a);
}
