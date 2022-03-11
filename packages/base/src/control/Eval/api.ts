import type { _A } from "../../types/extractions";

import { identity } from "../../data/function";
import { Chain, Eval } from "./definition";

/**
 * @tsplus fluent fncts.Eval chain
 */
export function chain_<A, B>(self: Eval<A>, f: (a: A) => Eval<B>): Eval<B> {
  return new Chain(self, f);
}

/**
 * @tsplus getter fncts.Eval flatten
 */
export function flatten<A>(self: Eval<Eval<A>>): Eval<A> {
  return self.chain(identity);
}

/**
 * @tsplus fluent fncts.Eval map
 */
export function map_<A, B>(self: Eval<A>, f: (a: A) => B): Eval<B> {
  return self.chain((a) => Eval.now(f(a)));
}

/**
 * @tsplus fluent fncts.Eval zipWith
 */
export function zipWith_<A, B, C>(self: Eval<A>, fb: Eval<B>, f: (a: A, b: B) => C): Eval<C> {
  return self.chain((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus fluent fncts.Eval ap
 */
export function ap_<A, B>(self: Eval<(a: A) => B>, fa: Eval<A>): Eval<B> {
  return self.zipWith(fa, (f, a) => f(a));
}

/**
 * @tsplus static fncts.EvalOps sequenceT
 */
export function sequenceT<A extends Array<Eval<any>>>(
  ...computations: A
): Eval<{ [K in keyof A]: _A<A[K]> }> {
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
  return state.value.computation.chain((a) => {
    const next = iterator.next(a);
    return runGenEval(next, iterator);
  });
}

/**
 * @tsplus static fncts.EvalOps gen
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

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => Eval<B>) {
  return (self: Eval<A>): Eval<B> => chain_(self, f);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Eval<A>): Eval<B> => map_(self, f);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: Eval<B>, f: (a: A, b: B) => C) {
  return (self: Eval<A>): Eval<C> => zipWith_(self, fb, f);
}
/**
 * @tsplus dataFirst ap_
 */
export function ap<A>(fa: Eval<A>) {
  return <B>(self: Eval<(a: A) => B>): Eval<B> => ap_(self, fa);
}
// codegen:end

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/sequenceArray";
// codegen:end
