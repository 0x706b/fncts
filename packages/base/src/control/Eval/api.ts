import type { _A } from "@fncts/base/types";

import { EvalPrimitive, EvalTag } from "@fncts/base/control/Eval/definition";
import { identity, tuple } from "@fncts/base/data/function";

/**
 * @tsplus pipeable fncts.control.Eval and
 */
export function and(that: Eval<boolean>) {
  return (self: Eval<boolean>): Eval<boolean> => {
    return self.zipWith(that, (b0, b1) => b0 && b1);
  };
}

/**
 * @tsplus pipeable fncts.control.Eval flatMap
 */
export function flatMap<A, B>(f: (a: A) => Eval<B>) {
  return (self: Eval<A>): Eval<B> => {
    const primitive = new EvalPrimitive(EvalTag.Chain) as any;
    primitive.i0    = self;
    primitive.i1    = f;
    return primitive;
  };
}

/**
 * @tsplus getter fncts.control.Eval flatten
 */
export function flatten<A>(self: Eval<Eval<A>>): Eval<A> {
  return self.flatMap(identity);
}

/**
 * @tsplus pipeable fncts.control.Eval map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Eval<A>): Eval<B> => {
    return self.flatMap((a) => Eval.now(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.control.Eval zipWith
 */
export function zipWith<A, B, C>(fb: Eval<B>, f: (a: A, b: B) => C) {
  return (self: Eval<A>): Eval<C> => {
    return self.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * @tsplus pipeable fncts.control.Eval zip
 */
export function zip<B>(fb: Eval<B>) {
  return <A>(self: Eval<A>): Eval<Zipped.Make<A, B>> => {
    return self.zipWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus pipeable fncts.control.Eval ap
 */
export function ap<A>(fa: Eval<A>) {
  return <B>(self: Eval<(a: A) => B>): Eval<B> => {
    return self.zipWith(fa, (f, a) => f(a));
  };
}

/**
 * @tsplus static fncts.control.EvalOps sequenceT
 */
export function sequenceT<A extends Array<Eval<any>>>(
  ...computations: A
): Eval<{
  [K in keyof A]: _A<A[K]>;
}> {
  return Eval.defer(Eval.now(computations.map((e) => e.run)) as Eval<any>);
}

class GenEval<A> {
  readonly _A!: () => A;
  *[Symbol.iterator](): Generator<GenEval<A>, A, any> {
    return yield this;
  }
  constructor(readonly computation: Eval<A>) {}
}

const __adapter = (_: Eval<any>) => new GenEval(_);

function runGenEval<T extends GenEval<A>, A>(
  state: IteratorYieldResult<T> | IteratorReturnResult<A>,
  iterator: Generator<T, A, any>,
): Eval<A> {
  if (state.done) {
    return Eval.now(state.value);
  }
  return state.value.computation.flatMap((a) => {
    const next = iterator.next(a);
    return runGenEval(next, iterator);
  });
}

/**
 * @tsplus static fncts.control.EvalOps gen
 */
export function gen<T extends GenEval<any>, A>(
  f: (i: { <A>(_: Eval<A>): GenEval<A> }) => Generator<T, A, any>,
): Eval<A> {
  return Eval.defer(() => {
    const iterator = f(__adapter);
    const state    = iterator.next();
    return runGenEval(state, iterator);
  });
}

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/sequenceArray.js";
// codegen:end
