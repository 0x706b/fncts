import type { Nullable } from "@fncts/base/types";

/**
 * @tsplus static fncts.MaybeOps just
 * @tsplus static fncts.JustOps __call
 */
export function just<A>(a: A): Maybe<A> {
  return new Just(a);
}

const _Nothing = new Nothing();

/**
 * @tsplus static fncts.MaybeOps nothing
 * @tsplus static fncts.NothingOps __call
 */
export function nothing<A = never>(): Maybe<A> {
  return _Nothing;
}

/**
 * @tsplus static fncts.MaybeOps fromNullable
 */
export function fromNullable<A>(a: Nullable<A>): Maybe<NonNullable<A>> {
  return a == null ? Nothing() : Just(a as NonNullable<A>);
}

/**
 * @tsplus static fncts.MaybeOps fromNullableK
 */
export function fromNullableK<P extends ReadonlyArray<unknown>, A>(f: (...params: P) => Nullable<A>) {
  return (...params: P): Maybe<NonNullable<A>> => Maybe.fromNullable(f(...params));
}

/**
 * @tsplus static fncts.MaybeOps fromPredicate
 */
export function fromPredicate<A>(a: A, p: Predicate<A>): Maybe<A>;
export function fromPredicate<A, B extends A>(a: A, p: Refinement<A, B>): Maybe<A>;
export function fromPredicate<A>(a: A, p: Predicate<A>): Maybe<A> {
  return p(a) ? Just(a) : Nothing();
}

/**
 * @tsplus static fncts.MaybeOps tryCatch
 */
export function tryCatch<A>(thunk: () => A): Maybe<A> {
  try {
    return Just(thunk());
  } catch {
    return Nothing();
  }
}

/**
 * @tsplus static fncts.MaybeOps tryCatchK
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
 * @tsplus static fncts.MaybeOps partial
 */
export function partial<P extends ReadonlyArray<unknown>, A>(f: (miss: () => never) => (...params: P) => A) {
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
