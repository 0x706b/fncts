import type { Both, Left, Right } from "@fncts/base/data/These/definition";
import type * as P from "@fncts/base/typeclass";

import { TheseTag } from "@fncts/base/data/These/definition";

/**
 * Applies a function inside `These` to a value inside another `These`.
 *
 * @tsplus pipeable fncts.These ap
 */
export function ap<E, A>(that: These<E, A>, /** @tsplus auto */ S: P.Semigroup<E>) {
  return <B>(self: These<E, (a: A) => B>): These<E, B> => {
    return self.zipWith(that, (f, a) => f(a), S);
  };
}

/**
 * Maps both the left and right sides of `These`.
 *
 * @tsplus pipeable fncts.These bimap
 */
export function bimap<E, A, E1, B>(f: (e: E) => E1, g: (a: A) => B) {
  return (self: These<E, A>): These<E1, B> => {
    switch (self._tag) {
      case TheseTag.Left:
        return These.left(f(self.left));
      case TheseTag.Right:
        return These.right(g(self.right));
      case TheseTag.Both:
        return These.both(f(self.left), g(self.right));
    }
  };
}

/**
 * Recovers from a `Left` value using the provided handler.
 *
 * @tsplus pipeable fncts.These catchAll
 */
export function catchAll<E, B>(f: (e: E) => These<E, B>) {
  return <A>(self: These<E, A>): These<E, A | B> => {
    if (self._tag === TheseTag.Left) {
      return f(self.left);
    }
    return self;
  };
}

/**
 * Drops the right value when this is `Both`, keeping only the left.
 *
 * @tsplus getter fncts.These condemn
 */
export function condemn<E, A>(self: These<E, A>): These<E, A> {
  if (self._tag === TheseTag.Both) {
    return These.left(self.left);
  }
  return self;
}

/**
 * Condemns `Both` to `Left` when the left value satisfies the predicate.
 *
 * @tsplus pipeable fncts.These condemnWhen
 */
export function condemnWhen<E>(p: Predicate<E>) {
  return <A>(self: These<E, A>): These<E, A> => {
    if (self._tag === TheseTag.Both && p(self.left)) {
      return These.left(self.left);
    }
    return self;
  };
}

/**
 * Chains computations, combining left values with the provided semigroup.
 *
 * @tsplus pipeable fncts.These flatMap
 */
export function flatMap<E, A, B>(f: (a: A) => These<E, B>, /** @tsplus auto */ S: P.Semigroup<E>) {
  return (self: These<E, A>): These<E, B> => {
    if (self._tag === TheseTag.Left) {
      return self;
    }
    if (self._tag === TheseTag.Right) {
      return f(self.right);
    }
    const that = f(self.right);
    switch (that._tag) {
      case TheseTag.Left:
        return These.left(S.combine(that.left)(self.left));
      case TheseTag.Right:
        return These.both(self.left, that.right);
      case TheseTag.Both:
        return These.both(S.combine(that.left)(self.left), that.right);
    }
  };
}

/**
 * Returns true when this value is `Both`.
 *
 * @tsplus fluent fncts.These isBoth
 */
export function isBoth<E, A>(self: These<E, A>): self is Both<E, A> {
  return self._tag === TheseTag.Both;
}

/**
 * Returns true when this value is `Left`.
 *
 * @tsplus fluent fncts.These isLeft
 */
export function isLeft<E, A>(self: These<E, A>): self is Left<E> {
  return self._tag === TheseTag.Left;
}

/**
 * Returns true when this value is `Right`.
 *
 * @tsplus fluent fncts.These isRight
 */
export function isRight<E, A>(self: These<E, A>): self is Right<A> {
  return self._tag === TheseTag.Right;
}

/**
 * Maps the right side of `These`.
 *
 * @tsplus pipeable fncts.These map
 */
export function map<A, B>(f: (a: A) => B) {
  return <E>(self: These<E, A>): These<E, B> => {
    switch (self._tag) {
      case TheseTag.Left:
        return self;
      case TheseTag.Right:
        return These.right(f(self.right));
      case TheseTag.Both:
        return These.both(self.left, f(self.right));
    }
  };
}

/**
 * Maps the left side of `These`.
 *
 * @tsplus pipeable fncts.These mapLeft
 */
export function mapLeft<E, E1>(f: (e: E) => E1) {
  return <A>(self: These<E, A>): These<E1, A> => {
    switch (self._tag) {
      case TheseTag.Left:
        return These.left(f(self.left));
      case TheseTag.Right:
        return self;
      case TheseTag.Both:
        return These.both(f(self.left), self.right);
    }
  };
}

/**
 * Combines two `These` values into a tuple.
 *
 * @tsplus pipeable fncts.These zip
 */
export function zip<E, B>(that: These<E, B>, /** @tsplus auto */ S: P.Semigroup<E>) {
  return <A>(self: These<E, A>): These<E, readonly [A, B]> => {
    return self.zipWith(that, (a, b) => [a, b], S);
  };
}

/**
 * Combines two `These` values with a function.
 *
 * @tsplus pipeable fncts.These zipWith
 */
export function zipWith<E, A, B, C>(that: These<E, B>, f: (a: A, b: B) => C, /** @tsplus auto */ S: P.Semigroup<E>) {
  return (self: These<E, A>): These<E, C> => {
    switch (self._tag) {
      case TheseTag.Left:
        switch (that._tag) {
          case TheseTag.Left:
            return These.left(S.combine(that.left)(self.left));
          case TheseTag.Right:
            return self;
          case TheseTag.Both:
            return These.left(S.combine(that.left)(self.left));
        }
      case TheseTag.Right:
        switch (that._tag) {
          case TheseTag.Left:
            return that;
          case TheseTag.Right:
            return These.right(f(self.right, that.right));
          case TheseTag.Both:
            return These.left(that.left);
        }
      case TheseTag.Both:
        switch (that._tag) {
          case TheseTag.Left:
            return These.left(S.combine(that.left)(self.left));
          case TheseTag.Right:
            return These.both(self.left, f(self.right, that.right));
          case TheseTag.Both:
            return These.both(S.combine(that.left)(self.left), f(self.right, that.right));
        }
    }
  };
}
