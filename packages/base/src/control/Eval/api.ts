import type { _A } from "@fncts/base/types";

import { EvalPrimitive, EvalTag } from "@fncts/base/control/Eval/definition";
import { identity } from "@fncts/base/data/function";

/**
 * Apply an evaluated function to an evaluated value.
 *
 * @tsplus pipeable fncts.control.Eval ap
 */
export function ap<A>(fa: Eval<A>) {
  return <B>(self: Eval<(a: A) => B>): Eval<B> => {
    return self.zipWith(fa, (f, a) => f(a));
  };
}

/**
 * Combine two boolean computations with logical AND.
 *
 * @tsplus pipeable fncts.control.Eval and
 */
export function and(that: Eval<boolean>) {
  return (self: Eval<boolean>): Eval<boolean> => {
    return self.zipWith(that, (b0, b1) => b0 && b1);
  };
}

/**
 * Sequence computations by feeding the result into `f`.
 *
 * @tsplus pipeable fncts.control.Eval flatMap
 */
export function flatMap<A, B>(f: (a: A) => Eval<B>) {
  return (self: Eval<A>): Eval<B> => {
    const primitive = new EvalPrimitive(EvalTag.FlatMap) as any;
    primitive.i0    = self;
    primitive.i1    = f;
    return primitive;
  };
}

/**
 * Repeat an effectful loop while `check` returns true.
 *
 * @tsplus static fncts.control.EvalOps whileLoop
 */
export function whileLoop<A>(check: Lazy<boolean>, body: Lazy<Eval<A>>, process: (a: A) => void): Eval<void> {
  return Eval.defer(() => {
    if (check()) {
      return body().flatMap((a) => {
        process(a);
        return whileLoop(check, body, process);
      });
    } else {
      return Eval.unit;
    }
  });
}

/**
 * Evaluate each element and collect results into a `Conc`.
 *
 * @tsplus static fncts.control.EvalOps forEach
 */
export function forEach<A, B>(as: Iterable<A>, f: (a: A) => Eval<B>): Eval<Conc<B>> {
  return Eval.defer(() => {
    const iterator               = as[Symbol.iterator]();
    let value: IteratorResult<A> = iterator.next();

    const out = new ConcBuilder<B>();

    return Eval.whileLoop(
      () => !value?.done,
      () => f(value!.value),
      (b) => {
        out.append(b);
        value = iterator.next();
      },
    ).map(() => out.result());
  });
}

/**
 * Flatten one level of nested `Eval`.
 *
 * @tsplus getter fncts.control.Eval flatten
 */
export function flatten<A>(self: Eval<Eval<A>>): Eval<A> {
  return self.flatMap(identity);
}

/**
 * Transform a successful computation result.
 *
 * @tsplus pipeable fncts.control.Eval map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Eval<A>): Eval<B> => {
    return self.flatMap((a) => Eval.now(f(a)));
  };
}

/**
 * Combine two computations with a function.
 *
 * @tsplus pipeable fncts.control.Eval zipWith
 */
export function zipWith<A, B, C>(fb: Eval<B>, f: (a: A, b: B) => C) {
  return (self: Eval<A>): Eval<C> => {
    return self.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * Combine two computations into a pair.
 *
 * @tsplus pipeable fncts.control.Eval zip
 */
export function zip<B>(fb: Eval<B>) {
  return <A>(self: Eval<A>): Eval<Zipped.Make<A, B>> => {
    return self.zipWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * Evaluate each element with index and collect results.
 */
export function foreachWithIndex<A, B>(as: Iterable<A>, f: (index: number, a: A) => Eval<B>): Eval<ReadonlyArray<B>> {
  return Eval.defer(() => {
    const it = as[Symbol.iterator]();
    let i    = 0;
    let result: IteratorResult<A> = it.next();

    const out: Array<B> = [];

    return Eval.whileLoop(
      () => !result.done,
      () => f(i, result.value),
      (b) => {
        i++;
        result = it.next();
        out.push(b);
      },
    ).map(() => out);
  });
}

/**
 * Evaluate each element and collect results in order.
 *
 * @tsplus static fncts.control.EvalOps foreach
 */
export function foreach<A, B>(as: Iterable<A>, f: (a: A) => Eval<B>): Eval<ReadonlyArray<B>> {
  return Eval.defer(() => {
    const it = as[Symbol.iterator]();
    let result: IteratorResult<A> = it.next();
    const out: Array<B>           = [];
    return Eval.whileLoop(
      () => !result.done,
      () => f(result.value),
      (b) => {
        result = it.next();
        out.push(b);
      },
    ).map(() => out);
  });
}

/**
 * Run many computations and collect their results.
 *
 * @tsplus static fncts.control.EvalOps all
 */
export function all<A extends ReadonlyArray<Eval<any>>>(...computations: A): Eval<{ [K in keyof A]: _A<A[K]> }>;
export function all<A extends Iterable<Eval<any>>>(
  computations: A,
): [A] extends [Iterable<infer A>] ? Eval<ReadonlyArray<_A<A>>> : never;
export function all<A extends Record<string, Eval<any>>>(computations: A): Eval<{ [K in keyof A]: _A<A[K]> }>;
export function all(
  ...args: [Record<string, Eval<any>>] | [Iterable<Eval<any>>] | ReadonlyArray<Eval<any>>
): Eval<any> {
  if (args.length === 1) {
    const arg = args[0];
    if (Symbol.iterator in arg) {
      return Eval.foreach(<Iterable<Eval<any>>>arg, identity);
    } else {
      return Eval.foreach(
        Object.entries(arg).map(([k, computation]) => (<Eval<any>>computation).map((value) => [k, value] as const)),
        identity,
      ).map((result) => {
        const out: Record<string, any> = {};
        for (const [k, v] of result) {
          out[k] = v;
        }
        return out;
      });
    }
  } else {
    return Eval.foreach(<Iterable<Eval<any>>>args, identity);
  }
}

/**
 * Wrapper type used by `Eval.gen` for yielded computations.
 */
class GenEval<A> {
  readonly _A!: () => A;

  /**
   * Yield this wrapper to the generator runtime.
   */
  *[Symbol.iterator](): Generator<GenEval<A>, A, any> {
    return yield this;
  }
  constructor(readonly computation: Eval<A>) {}
}

const __adapter = (_: Eval<any>) => new GenEval(_);

/**
 * Continue a generator-based `Eval` program until completion.
 */
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
 * Build an `Eval` program from generator syntax.
 *
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
