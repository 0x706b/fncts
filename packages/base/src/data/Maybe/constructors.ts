import type { Nullable } from "../../types/Nullable.js";
import type { Predicate } from "../Predicate.js";
import type { Refinement } from "../Refinement.js";

import { Just, Maybe, Nothing } from "./definition.js";

/**
 * @tsplus static fncts.data.MaybeOps just
 * @tsplus static fncts.JustOps __call
 */
export function just<A>(a: A): Maybe<A> {
  return new Just(a);
}

const _Nothing = new Nothing();

/**
 * @tsplus static fncts.data.MaybeOps nothing
 * @tsplus static fncts.NothingOps __call
 */
export function nothing<A = never>(): Maybe<A> {
  return _Nothing;
}

/**
 * @tsplus static fncts.data.MaybeOps fromNullable
 */
export function fromNullable<A>(a: Nullable<A>): Maybe<NonNullable<A>> {
  return a == null ? Nothing() : Just(a as NonNullable<A>);
}

/**
 * @tsplus static fncts.data.MaybeOps fromNullableK
 */
export function fromNullableK<P extends ReadonlyArray<unknown>, A>(
  f: (...params: P) => Nullable<A>,
) {
  return (...params: P): Maybe<NonNullable<A>> => Maybe.fromNullable(f(...params));
}

/**
 * @tsplus static fncts.data.MaybeOps fromPredicate
 */
export function fromPredicate_<A>(a: A, p: Predicate<A>): Maybe<A>;
export function fromPredicate_<A, B extends A>(a: A, p: Refinement<A, B>): Maybe<A>;
export function fromPredicate_<A>(a: A, p: Predicate<A>): Maybe<A> {
  return p(a) ? Just(a) : Nothing();
}

/**
 * @tsplus static fncts.data.MaybeOps tryCatch
 */
export function tryCatch<A>(thunk: () => A): Maybe<A> {
  try {
    return Just(thunk());
  } catch {
    return Nothing();
  }
}

/**
 * @tsplus static fncts.data.MaybeOps tryCatchK
 */
export function tryCatchK<P extends ReadonlyArray<unknown>, A>(f: (...params: P) => A) {
  return (...params: P): Maybe<A> => tryCatch(() => f(...params));
}

class PartialException {
  readonly _tag = "PartialException";
}

function raisePartial(): never {
  throw new PartialException();
}

/**
 * @tsplus static fncts.data.MaybeOps partial
 */
export function partial<P extends ReadonlyArray<unknown>, A>(
  f: (miss: () => never) => (...params: P) => A,
) {
  return (...params: P): Maybe<A> => {
    try {
      return Just(f(raisePartial)(...params));
    } catch (e) {
      if (e instanceof PartialException) {
        return Nothing();
      }
      throw e;
    }
  };
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst fromPredicate_
 */
export function fromPredicate<A>(p: Predicate<A>): (a: A) => Maybe<A>;
/**
 * @tsplus dataFirst fromPredicate_
 */
export function fromPredicate<A, B extends A>(p: Refinement<A, B>): (a: A) => Maybe<A>;
/**
 * @tsplus dataFirst fromPredicate_
 */
export function fromPredicate<A>(p: Predicate<A>) {
  return (a: A): Maybe<A> => fromPredicate_(a, p);
}
// codegen:end
