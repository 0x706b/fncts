import type { Both, Left, Right } from "@fncts/base/data/These/definition";
import type * as P from "@fncts/base/typeclass";

import { TheseTag } from "@fncts/base/data/These/definition";

/**
 * @tsplus fluent fncts.These isLeft
 */
export function isLeft<E, A>(self: These<E, A>): self is Left<E> {
  return self._tag === TheseTag.Left;
}

/**
 * @tsplus fluent fncts.These isRight
 */
export function isRight<E, A>(self: These<E, A>): self is Right<A> {
  return self._tag === TheseTag.Right;
}

/**
 * @tsplus fluent fncts.These isBoth
 */
export function isBoth<E, A>(self: These<E, A>): self is Both<E, A> {
  return self._tag === TheseTag.Both;
}

/**
 * @tsplus fluent fncts.These map
 */
export function map<E, A, B>(self: These<E, A>, f: (a: A) => B): These<E, B> {
  switch (self._tag) {
    case TheseTag.Left:
      return self;
    case TheseTag.Right:
      return These.right(f(self.right));
    case TheseTag.Both:
      return These.both(self.left, f(self.right));
  }
}

/**
 * @tsplus fluent fncts.These mapLeft
 */
export function mapLeft<E, A, E1>(self: These<E, A>, f: (e: E) => E1): These<E1, A> {
  switch (self._tag) {
    case TheseTag.Left:
      return These.left(f(self.left));
    case TheseTag.Right:
      return self;
    case TheseTag.Both:
      return These.both(f(self.left), self.right);
  }
}

/**
 * @tsplus fluent fncts.These bimap
 */
export function bimap<E, A, E1, B>(self: These<E, A>, f: (e: E) => E1, g: (a: A) => B): These<E1, B> {
  switch (self._tag) {
    case TheseTag.Left:
      return These.left(f(self.left));
    case TheseTag.Right:
      return These.right(g(self.right));
    case TheseTag.Both:
      return These.both(f(self.left), g(self.right));
  }
}

/**
 * @tsplus fluent fncts.These zipWith
 */
export function zipWith<E, A, B, C>(
  self: These<E, A>,
  that: These<E, B>,
  f: (a: A, b: B) => C,
  /** @tsplus auto */ S: P.Semigroup<E>,
): These<E, C> {
  switch (self._tag) {
    case TheseTag.Left:
      switch (that._tag) {
        case TheseTag.Left:
          return These.left(S.combine(self.left, that.left));
        case TheseTag.Right:
          return self;
        case TheseTag.Both:
          return These.left(S.combine(self.left, that.left));
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
          return These.left(S.combine(self.left, that.left));
        case TheseTag.Right:
          return These.both(self.left, f(self.right, that.right));
        case TheseTag.Both:
          return These.both(S.combine(self.left, that.left), f(self.right, that.right));
      }
  }
}

/**
 * @tsplus fluent fncts.These zip
 */
export function zip<E, A, B>(
  self: These<E, A>,
  that: These<E, B>,
  /** @tsplus auto */ S: P.Semigroup<E>,
): These<E, readonly [A, B]> {
  return self.zipWith(that, (a, b) => [a, b], S);
}

/**
 * @tsplus fluent fncts.These ap
 */
export function ap<E, A, B>(
  self: These<E, (a: A) => B>,
  that: These<E, A>,
  /** @tsplus auto */ S: P.Semigroup<E>,
): These<E, B> {
  return self.zipWith(that, (f, a) => f(a), S);
}

/**
 * @tsplus fluent fncts.These flatMap
 */
export function flatMap<E, A, B>(
  self: These<E, A>,
  f: (a: A) => These<E, B>,
  /** @tsplus auto */ S: P.Semigroup<E>,
): These<E, B> {
  if (self._tag === TheseTag.Left) {
    return self;
  }
  if (self._tag === TheseTag.Right) {
    return f(self.right);
  }
  const that = f(self.right);
  switch (that._tag) {
    case TheseTag.Left:
      return These.left(S.combine(self.left, that.left));
    case TheseTag.Right:
      return These.both(self.left, that.right);
    case TheseTag.Both:
      return These.both(S.combine(self.left, that.left), that.right);
  }
}

/**
 * @tsplus fluent fncts.These catchAll
 */
export function catchAll_<E, A, B>(self: These<E, A>, f: (e: E) => These<E, B>): These<E, A | B> {
  if (self._tag === TheseTag.Left) {
    return f(self.left);
  }
  return self;
}

/**
 * @tsplus getter fncts.These condemn
 */
export function condemn<E, A>(self: These<E, A>): These<E, A> {
  if (self._tag === TheseTag.Both) {
    return These.left(self.left);
  }
  return self;
}

/**
 * @tsplus fluent fncts.These condemnWhen
 */
export function condemnWhen<E, A>(self: These<E, A>, p: Predicate<E>): These<E, A> {
  if (self._tag === TheseTag.Both && p(self.left)) {
    return These.left(self.left);
  }
  return self;
}
