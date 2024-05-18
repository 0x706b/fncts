import { And, FreeBooleanAlgebra, FreeBooleanAlgebraTag, Not, Or, Value } from "./definition.js";

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra and
 * @tsplus pipeable-operator fncts.test.FreeBooleanAlgebra &&
 */
export function and<A>(right: FreeBooleanAlgebra<A>) {
  return (left: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<A> => {
    return new And(left, right);
  };
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra flatMap
 */
export function flatMap<A, B>(f: (a: A) => FreeBooleanAlgebra<B>) {
  return (self: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<B> => {
    return self.fold({
      Value: f,
      And: (l, r) => l && r,
      Or: (l, r) => l || r,
      Not: (v) => v.invert,
    });
  };
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<B> => {
    return self.flatMap((a) => FreeBooleanAlgebra.success(f(a)));
  };
}

/**
 * @tsplus static fncts.test.FreeBooleanAlgebraOps failure
 */
export function failure<A>(a: A): FreeBooleanAlgebra<A> {
  return FreeBooleanAlgebra.success(a).invert;
}

/**
 * @tsplus getter fncts.test.FreeBooleanAlgebra failures
 */
export function failures<A>(self: FreeBooleanAlgebra<A>): Maybe<FreeBooleanAlgebra<A>> {
  return self
    .fold<A, Either<FreeBooleanAlgebra<A>, FreeBooleanAlgebra<A>>>({
      Value: (a) => Either.right(FreeBooleanAlgebra.success(a)),
      And: (l, r) => {
        Either.concrete(l);
        Either.concrete(r);
        return l.isRight()
          ? r.isRight()
            ? Either.right(l.right && r.right)
            : r
          : r.isRight()
            ? l
            : Either.left(l.left && r.left);
      },
      Or: (l, r) => {
        Either.concrete(l);
        Either.concrete(r);
        return l.isRight()
          ? r.isRight()
            ? Either.right(l.right || r.right)
            : l
          : r.isRight()
            ? r
            : Either.left(l.left || r.left);
      },
      Not: (v) => v.swap,
    })
    .match(Maybe.just, () => Nothing());
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra foldEval
 */
export function foldEval<A, B>(cases: {
  Value: (value: A) => B;
  And: (left: B, right: B) => B;
  Or: (left: B, right: B) => B;
  Not: (value: B) => B;
}) {
  return (self: FreeBooleanAlgebra<A>): Eval<B> => {
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
  };
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra fold
 */
export function fold<A, B>(cases: {
  Value: (value: A) => B;
  And: (left: B, right: B) => B;
  Or: (left: B, right: B) => B;
  Not: (value: B) => B;
}) {
  return (self: FreeBooleanAlgebra<A>): B => {
    return self.foldEval(cases).run;
  };
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra iff
 */
export function iff<A>(right: FreeBooleanAlgebra<A>) {
  return (left: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<A> => {
    return left.implies(right) && right.implies(left);
  };
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra implies
 */
export function implies<A>(right: FreeBooleanAlgebra<A>) {
  return (left: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<A> => {
    return left.invert || right;
  };
}

/**
 * @tsplus getter fncts.test.FreeBooleanAlgebra isFailure
 */
export function isFailure<A>(self: FreeBooleanAlgebra<A>): boolean {
  return !self.isSuccess;
}

/**
 * @tsplus getter fncts.test.FreeBooleanAlgebra isSuccess
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
 * @tsplus getter fncts.test.FreeBooleanAlgebra invert
 */
export function not<A>(self: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<A> {
  return new Not(self);
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebra or
 * @tsplus pipeable-operator fncts.test.FreeBooleanAlgebra ||
 */
export function or<A>(right: FreeBooleanAlgebra<A>) {
  return (left: FreeBooleanAlgebra<A>): FreeBooleanAlgebra<A> => {
    return new Or(left, right);
  };
}

/**
 * @tsplus static fncts.test.FreeBooleanAlgebraOps success
 */
export function success<A>(a: A): FreeBooleanAlgebra<A> {
  return new Value(a);
}
