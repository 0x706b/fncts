/* eslint-disable prefer-const */
import type { MutableVector, VectorF } from "@fncts/base/collection/immutable/Vector/definition";
import type { Eq, Monoid, Ord, Ordering, Traversable } from "@fncts/base/typeclass";
import type * as P from "@fncts/base/typeclass";

import {
  affixPush,
  appendNodeToTree,
  arrayPush,
  branchBits,
  concatAffixes,
  concatBuffer,
  concatSubTree,
  copyArray,
  emptyAffix,
  foldLeftCb,
  foldLeftNode,
  foldLeftPrefix,
  foldLeftSuffix,
  foldRightCb,
  foldRightNode,
  foldRightPrefix,
  foldRightSuffix,
  getDepth,
  getHeight,
  getPrefixSize,
  getSuffixSize,
  handleOffset,
  incrementPrefix,
  incrementSuffix,
  mapAffix,
  mapNode,
  mapPrefix,
  mask,
  newAffix,
  newOffset,
  nodeNth,
  nodeNthDense,
  prependNodeToTree,
  push,
  reverseArray,
  setDepth,
  setPrefix,
  setSizes,
  setSuffix,
  sliceLeft,
  sliceRight,
  sliceTreeVector,
  updateNode,
  zeroOffset,
} from "@fncts/base/collection/immutable/Vector/internal";

/**
 * Appends an element to the end of a Vector and returns the new Vector.
 *
 * @complexity O(n)
 *
 * @tsplus pipeable fncts.Vector append
 * @tsplus pipeable-operator fncts.Vector +
 */
export function append<A>(a: A) {
  return (self: Vector<A>): Vector<A> => {
    const suffixSize = getSuffixSize(self);
    if (suffixSize < 32) {
      return new Vector(
        incrementSuffix(self.bits),
        self.offset,
        self.length + 1,
        self.prefix,
        self.root,
        affixPush(a, self.suffix, suffixSize),
      );
    }
    const newSuffix = [a];
    const newVector = mutableClone(self);
    appendNodeToTree(newVector, self.suffix);
    newVector.suffix = newSuffix;
    newVector.length++;
    newVector.bits = setSuffix(1, newVector.bits);
    return newVector;
  };
}

/**
 * Maps a function over a Vector and concatenates all the resulting
 * Vectors together.
 *
 * @tsplus pipeable fncts.Vector flatMap
 */
export function flatMap<A, B>(f: (a: A) => Vector<B>) {
  return (self: Vector<A>): Vector<B> => {
    return self.map(f).flatten;
  };
}

/**
 * Splits the Vector into chunks of the given size.
 *
 * @tsplus pipeable fncts.Vector chunksOf
 */
export function chunksOf(size: number) {
  return <A>(self: Vector<A>): Vector<Vector<A>> => {
    const { buffer, l2 } = self.foldLeft(
      { l2: Vector.emptyPushable<Vector<A>>(), buffer: Vector.emptyPushable<A>() },
      ({ buffer, l2 }, elem) => {
        buffer.push(elem);
        if (buffer.length === size) {
          return { l2: l2.push(buffer), buffer: Vector.emptyPushable<A>() };
        } else {
          return { l2, buffer };
        }
      },
    );
    return buffer.length === 0 ? l2 : l2.push(buffer);
  };
}

/**
 * Concatenates two Vectors.
 *
 * @complexity O(log(n))
 * @tsplus pipeable fncts.Vector concat
 * @tsplus pipeable-operator fncts.Vector + 1
 */
export function concat<B>(that: Vector<B>): <A>(self: Vector<A>) => Vector<A | B>;
export function concat<A>(that: Vector<A>) {
  return (self: Vector<A>): Vector<A> => {
    if (self.length === 0) {
      return that;
    } else if (that.length === 0) {
      return self;
    }
    const newSize         = self.length + that.length;
    const rightSuffixSize = getSuffixSize(that);
    let newVector         = self.mutableClone;
    if (that.root === undefined) {
      // right is nothing but a prefix and a suffix
      const nrOfAffixes = concatAffixes(self, that);
      for (let i = 0; i < nrOfAffixes; ++i) {
        newVector         = appendNodeToTree(newVector, concatBuffer[i]);
        newVector.length += concatBuffer[i].length;
        // wipe pointer, otherwise it might end up keeping the array alive
        concatBuffer[i] = undefined;
      }
      newVector.length          = newSize;
      newVector.suffix          = concatBuffer[nrOfAffixes];
      newVector.bits            = setSuffix(concatBuffer[nrOfAffixes].length, newVector.bits);
      concatBuffer[nrOfAffixes] = undefined;
      return newVector;
    } else {
      const leftSuffixSize = getSuffixSize(self);
      if (leftSuffixSize > 0) {
        newVector         = appendNodeToTree(newVector, self.suffix.slice(0, leftSuffixSize));
        newVector.length += leftSuffixSize;
      }
      newVector      = appendNodeToTree(newVector, that.prefix.slice(0, getPrefixSize(that)).reverse());
      const newNode  = concatSubTree(newVector.root!, getDepth(newVector), that.root, getDepth(that), true);
      const newDepth = getHeight(newNode);
      setSizes(newNode, newDepth);
      newVector.root    = newNode;
      newVector.offset &= ~(mask << (getDepth(self) * branchBits));
      newVector.length  = newSize;
      newVector.bits    = setSuffix(rightSuffixSize, setDepth(newDepth, newVector.bits));
      newVector.suffix  = that.suffix;
      return newVector;
    }
  };
}

type ContainsState = {
  element: any;
  result: boolean;
};

const containsState: ContainsState = {
  element: undefined,
  result: false,
};

function containsCb(value: any, state: ContainsState): boolean {
  return !(state.result = value === state.element);
}

/**
 * Returns `true` if the Vector contains the specified element.
 * Otherwise it returns `false`.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector contains
 */
export function contains<A>(element: A) {
  return (self: Vector<A>): boolean => {
    containsState.element = element;
    containsState.result  = false;
    return foldLeftCb(containsCb, containsState, self).result;
  };
}

/**
 * Returns a new Vector without the first `n` elements.
 *
 * @complexity `O(log(n))`
 * @tsplus pipeable fncts.Vector drop
 */
export function drop(n: number) {
  return <A>(self: Vector<A>): Vector<A> => {
    return self.slice(n, self.length);
  };
}

/**
 * Returns a new Vector without the last `n` elements.
 *
 * @complexity `O(log(n))`
 * @tsplus pipeable fncts.Vector dropLast
 */
export function dropLast(n: number) {
  return <A>(self: Vector<A>): Vector<A> => {
    return self.slice(0, self.length - n);
  };
}

/**
 * Returns a new Vector without repeated elements.
 *
 * @complexity `O(n)`
 * @tsplus getter fncts.Vector dropRepeats
 */
export function dropRepeats<A>(self: Vector<A>): Vector<A> {
  return self.dropRepeatsWith(Equatable.strictEquals);
}

/**
 * Returns a new Vector without repeated elements by using the given
 * function to determine when elements are equal.
 *
 * @complexity `O(n)`
 * @tsplus pipeable fncts.Vector dropRepeatsWith
 */
export function dropRepeatsWith<A>(predicate: (a: A, b: A) => boolean) {
  return (self: Vector<A>): Vector<A> => {
    return self.foldLeft(Vector.emptyPushable(), (acc, a) =>
      acc.length !== 0 && predicate((acc as Vector<A>).unsafeLast!, a) ? acc : acc.push(a),
    );
  };
}

type FindNotIndexState = {
  predicate: (a: any) => boolean;
  index: number;
};

function findNotIndexCb(value: any, state: FindNotIndexState): boolean {
  if (state.predicate(value)) {
    ++state.index;
    return true;
  } else {
    return false;
  }
}

/**
 * Removes the first elements in the Vector for which the predicate returns
 * `true`.
 *
 * @complexity `O(k + log(n))` where `k` is the number of elements
 * satisfying the predicate.
 * @tsplus pipeable fncts.Vector dropWhile
 */
export function dropWhile<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): Vector<A> => {
    const { index } = foldLeftCb(findNotIndexCb, { predicate, index: 0 }, self);
    return self.slice(index, self.length);
  };
}

type ElemState = {
  element: any;
  equals: (y: any) => (x: any) => boolean;
  result: boolean;
};

function elemCb(value: any, state: ElemState): boolean {
  return !(state.result = state.equals(state.element)(value));
}

/**
 * @tsplus pipeable fncts.Vector elem
 */
export function elem<A>(a: A, /** @tsplus auto */ E: Eq<A>) {
  const elemState: ElemState = { equals: E.equals, element: undefined, result: false };
  return (self: Vector<A>): boolean => {
    elemState.element = a;
    return foldLeftCb(elemCb, elemState, self).result;
  };
}
/**
 * Returns true if the two Vectors are equivalent.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector equals
 */
export function equals<A>(that: Vector<A>) {
  return (self: Vector<A>): boolean => {
    return self.corresponds(that, Equatable.strictEquals);
  };
}

type PredState = {
  predicate: (a: any) => boolean;
  result: any;
};

function everyCb<A>(value: A, state: any): boolean {
  return (state.result = state.predicate(value));
}

/**
 * Returns `true` if and only if the predicate function returns `true`
 * for all elements in the given Vector.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector every
 */
export function every<A, B extends A>(refinement: Refinement<A, B>): (self: Vector<A>) => self is Vector<B>;
export function every<A>(predicate: Predicate<A>): (self: Vector<A>) => boolean;
export function every<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): boolean => {
    return foldLeftCb<A, PredState>(everyCb, { predicate, result: true }, self).result;
  };
}

/**
 * Creates an empty Vector.
 *
 * @complexity O(1)
 * @tsplus static fncts.VectorOps empty
 */
export function empty<A = never>(): Vector<A> {
  return new Vector(0, 0, 0, emptyAffix, undefined, emptyAffix);
}

/**
 * @tsplus static fncts.VectorOps emptyPushable
 */
export function emptyPushable<A = never>(): MutableVector<A> {
  return new Vector(0, 0, 0, [], undefined, []) as any;
}

function someCb<A>(value: A, state: PredState): boolean {
  return !(state.result = state.predicate(value));
}

/**
 * Returns true if and only if there exists an element in the Vector for
 * which the predicate returns true.
 *
 * @complexity O(n)
 *
 * @tsplus pipeable fncts.Vector some
 */
export function some<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): boolean => {
    return foldLeftCb<A, PredState>(someCb, { predicate, result: false }, self).result;
  };
}

/**
 * Returns the _first_ element for which the predicate returns `true`.
 * If no such element is found the function returns `undefined`.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector find
 */
export function find<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): Maybe<A> => {
    return Maybe.fromNullable(self.unsafeFind(predicate));
  };
}

type FindIndexState = {
  predicate: (a: any) => boolean;
  found: boolean;
  index: number;
};

function findIndexCb<A>(value: A, state: FindIndexState): boolean {
  ++state.index;
  return !(state.found = state.predicate(value));
}

/**
 * Returns the index of the `first` element for which the predicate
 * returns true. If no such element is found the function returns
 * `-1`.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector findIndex
 */
export function findIndex<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): number => {
    const { found, index } = foldLeftCb<A, FindIndexState>(findIndexCb, { predicate, found: false, index: -1 }, self);
    return found ? index : -1;
  };
}

/**
 * Returns the _last_ element for which the predicate returns `true`.
 * If no such element is found the function returns `undefined`.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector findLast
 */
export function findLast<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): Maybe<A> => {
    return Maybe.fromNullable(self.unsafeFindLast(predicate));
  };
}

/**
 * Returns the index of the `last` element for which the predicate
 * returns true. If no such element is found the function returns
 * `-1`.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector findLastIndex
 */
export function findLastIndex<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): number => {
    const { found, index } = foldRightCb<A, FindIndexState>(findIndexCb, { predicate, found: false, index: -0 }, self);
    return found ? index : -1;
  };
}

/**
 * Flattens a Vector of Vectors into a Vector. Note that this function does
 * not flatten recursively. It removes one level of nesting only.
 *
 * @complexity O(n * log(m)), where n is the length of the outer Vector and m the length of the inner Vectors.
 *
 * @tsplus getter fncts.Vector flatten
 */
export function flatten<A>(self: Vector<Vector<A>>): Vector<A> {
  return self.foldLeft<Vector<A>, Vector<A>>(Vector.empty(), (acc, a) => acc.concat(a));
}

/**
 * Converts an array, an array-like, or an iterable into a Vector.
 *
 * @complexity O(n)
 * @tsplus static fncts.VectorOps from
 */
export function from<A>(sequence: A[] | ArrayLike<A> | Iterable<A>): Vector<A>;
export function from<A>(sequence: any): Vector<A> {
  const l = emptyPushable<A>();
  if (sequence.length > 0 && (sequence[0] !== undefined || 0 in sequence)) {
    for (let i = 0; i < sequence.length; ++i) {
      l.push(sequence[i]);
    }
  } else if (Symbol.iterator in sequence) {
    const iterator = sequence[Symbol.iterator]();
    let cur;
    while (!(cur = iterator.next()).done) {
      l.push(cur.value);
    }
  }
  return l;
}

/**
 * Folds a function over a Vector. Left-associative.
 *
 * @tsplus pipeable fncts.Vector foldLeft
 */
export function foldLeft<A, B>(initial: B, f: (acc: B, a: A) => B) {
  return (self: Vector<A>): B => {
    return self.foldLeftWithIndex(initial, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.Vector foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: Vector<A>): B => {
    const suffixSize = getSuffixSize(self);
    const prefixSize = getPrefixSize(self);
    let [acc, index] = foldLeftPrefix(f, b, self.prefix, prefixSize);
    if (self.root !== undefined) {
      [acc, index] = foldLeftNode(f, acc, self.root, getDepth(self), index);
    }
    return foldLeftSuffix(f, acc, self.suffix, suffixSize, index)[0];
  };
}

type FoldWhileState<A, B> = {
  predicate: Predicate<B>;
  result: B;
  f: (i: number, b: B, a: A) => B;
};

/**
 * Similar to `foldl`. But, for each element it calls the predicate function
 * _before_ the folding function and stops folding if it returns `false`.
 *
 *
 * @example
 * const isOdd = (_acc:, x) => x % 2 === 1;
 *
 * const xs = V.vector(1, 3, 5, 60, 777, 800);
 * foldlWhile(isOdd, (n, m) => n + m, 0, xs) //=> 9
 *
 * const ys = V.vector(2, 4, 6);
 * foldlWhile(isOdd, (n, m) => n + m, 111, ys) //=> 111
 */
function foldWhileCb<A, B>(a: A, state: FoldWhileState<A, B>, i: number): boolean {
  if (state.predicate(state.result) === false) {
    return false;
  }
  state.result = state.f(i, state.result, a);
  return true;
}

/**
 * @tsplus pipeable fncts.Vector foldLeftWhile
 */
export function foldLeftWhile<A, B>(b: B, cont: Predicate<B>, f: (i: number, b: B, a: A) => B) {
  return (self: Vector<A>): B => {
    if (!cont(b)) {
      return b;
    }
    return foldLeftCb<A, FoldWhileState<A, B>>(foldWhileCb, { predicate: cont, f, result: b }, self).result;
  };
}

/**
 * @tsplus pipeable fncts.Vector foldRightWhile
 */
export function foldRightWhile<A, B>(b: B, cont: Predicate<B>, f: (i: number, a: A, b: B) => B) {
  return (self: Vector<A>): B => {
    return foldRightCb<A, FoldWhileState<A, B>>(
      foldWhileCb,
      { predicate: cont, result: b, f: (i, b, a) => f(i, a, b) },
      self,
    ).result;
  };
}

/**
 * @tsplus pipeable fncts.Vector foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: Vector<A>): M => {
    return self.foldMapWithIndex((_, a) => f(a), M);
  };
}

/**
 * @tsplus pipeable fncts.Vector foldMapWithIndex
 */
export function foldMapWithIndex<A, M>(f: (i: number, a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: Vector<A>): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(f(i, a))(b));
  };
}

/**
 * Folds a function over a Vector. Right-associative.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector foldRight
 */
export function foldRight<A, B>(initial: B, f: (value: A, acc: B) => B) {
  return (self: Vector<A>): B => {
    return self.foldRightWithIndex(initial, (_, a, b) => f(a, b));
  };
}

/**
 * Folds a function over a Vector. Right-associative.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector foldRightWithIndex
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: Vector<A>): B => {
    const suffixSize = getSuffixSize(self);
    const prefixSize = getPrefixSize(self);
    let [acc, j]     = foldRightSuffix(f, b, self.suffix, suffixSize, self.length - 1);
    if (self.root !== undefined) {
      [acc, j] = foldRightNode(f, acc, self.root, getDepth(self), j);
    }
    return foldRightPrefix(f, acc, self.prefix, prefixSize, j)[0];
  };
}

/**
 * Invokes a given callback for each element in the Vector from left to
 * right. Returns `undefined`.
 *
 * This function is very similar to map. It should be used instead of
 * `map` when the mapping function has side-effects. Whereas `map`
 * constructs a new Vector `forEach` merely returns `undefined`. This
 * makes `forEach` faster when the new Vector is unneeded.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector forEach
 */
export function forEach<A>(f: (a: A) => void) {
  return (self: Vector<A>): void => {
    self.foldLeft(undefined as void, (_, element) => f(element));
  };
}

/**
 * @tsplus pipeable fncts.Vector forEachWithIndex
 */
export function forEachWithIndex<A>(f: (i: number, a: A) => void) {
  return (self: Vector<A>): void => {
    self.foldLeftWithIndex(undefined as void, (index, _, element) => f(index, element));
  };
}

/**
 * Gets the nth element of the Vector. If `n` is out of bounds
 * `undefined` is returned.
 *
 * @complexity O(log(n))
 * @tsplus pipeable fncts.Vector get
 */
export function get(index: number) {
  return <A>(self: Vector<A>): Maybe<A> => {
    return Maybe.fromNullable(self.unsafeGet(index));
  };
}

/**
 * Returns a Vector of Vectors where each subvector's elements are pairwise
 * equal based on the given comparison function.
 *
 * Note that only adjacent elements are compared for equality. If all
 * equal elements should be grouped together the Vector should be sorted
 * before grouping.
 *
 * @tsplus pipeable fncts.Vector groupWith
 */
export function groupWith<A>(f: (a: A, b: A) => boolean) {
  return (self: Vector<A>): Vector<Vector<A>> => {
    const result = Vector.emptyPushable<MutableVector<A>>();
    let buffer   = Vector.emptyPushable<A>();
    self.forEach((a) => {
      if (buffer.length !== 0 && !f(unsafeLast(buffer)!, a)) {
        result.push(buffer);
        buffer = emptyPushable();
      }
      buffer.push(a);
    });
    return buffer.length === 0 ? result : result.push(buffer);
  };
}

/**
 * Returns the first element of the Vector.
 *
 * @complexity O(1)
 * @tsplus getter fncts.Vector head
 */
export function head<A>(self: Vector<A>): Maybe<NonNullable<A>> {
  return Maybe.fromNullable(self.unsafeHead);
}

type IndexOfState = {
  element: any;
  found: boolean;
  index: number;
};

function indexOfCb(value: any, state: IndexOfState): boolean {
  ++state.index;
  return !(state.found = Equatable.strictEquals(value, state.element));
}

/**
 * Returns the index of the _first_ element in the Vector that is equal
 * to the given element. If no such element is found `-1` is returned.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector indexOf
 */
export function indexOf<A>(element: A) {
  return (self: Vector<A>): number => {
    const state = { element, found: false, index: -1 };
    foldLeftCb(indexOfCb, state, self);
    return state.found ? state.index : -1;
  };
}

/**
 * Inserts the given element at the given index in the Vector.
 *
 * @complexity O(log(n))
 * @tsplus pipeable fncts.Vector insertAt
 */
export function insertAt<A>(index: number, element: A) {
  return (self: Vector<A>): Vector<A> => {
    return self.slice(0, index).append(element).concat(self.slice(index, self.length));
  };
}

/**
 * Inserts the given Vector of elements at the given index in the Vector.
 *
 * @complexity `O(log(n))`
 * @tsplus pipeable fncts.Vector insertAllAt
 */
export function insertAllAt<A>(index: number, elements: Vector<A>) {
  return (self: Vector<A>): Vector<A> => {
    return self.slice(0, index).concat(elements).concat(self.slice(index, self.length));
  };
}

/**
 * Inserts a separator between each element in a Vector.
 *
 * @tsplus pipeable fncts.Vector intersperse
 */
export function intersperse<A>(separator: A) {
  return (self: Vector<A>): Vector<A> => {
    return (self.foldLeft(Vector.emptyPushable(), (l2, a) => l2.push(a).push(separator)) as Vector<A>).pop;
  };
}

/**
 * @tsplus fluent fncts.Vector isEmpty
 */
export function isEmpty<A>(self: Vector<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus fluent fncts.Vector isNonEmpty
 */
export function isNonEmpty<A>(self: Vector<A>): boolean {
  return self.length > 0;
}

/**
 * Concatenates the strings in the Vector separated by a specified separator.
 *
 * @tsplus pipeable fncts.Vector join
 */
export function join(separator: string) {
  return (self: Vector<string>): string => {
    return self.foldLeft("", (a, b) => (a.length === 0 ? b : a + separator + b));
  };
}

/**
 * Returns the last element of the Vector.
 *
 * @complexity O(1)
 * @tsplus getter fncts.Vector last
 */
export function last<A>(self: Vector<A>): Maybe<NonNullable<A>> {
  return Maybe.fromNullable(self.unsafeLast);
}

/**
 * Returns the index of the _last_ element in the Vector that is equal
 * to the given element. If no such element is found `-1` is returned.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector lastIndexOf
 */
export function lastIndexOf<A>(element: A) {
  return (self: Vector<A>): number => {
    const state = { element, found: false, index: 0 };
    foldRightCb(indexOfCb, state, self);
    return state.found ? self.length - state.index : -1;
  };
}

/**
 * Generates a new Vector by calling a function with the current index
 * `n` times.
 *
 * @complexity O(n)
 * @tsplus static fncts.VectorOps makeBy
 */
export function makeBy<A>(n: number, f: (index: number) => A): Vector<A> {
  const l = emptyPushable<A>();
  for (let i = 0; i < n; i++) {
    l.push(f(i));
  }
  return l;
}

/**
 * @tsplus pipeable fncts.Vector mapAccum
 */
export function mapAccum<A, S, B>(s: S, f: (s: S, a: A) => readonly [B, S]) {
  return (self: Vector<A>): readonly [Vector<B>, S] => {
    return self.foldLeft([Vector.emptyPushable(), s], ([acc, s], a) => {
      const r = f(s, a);
      acc.push(r[0]);
      return [acc, r[1]];
    });
  };
}

/**
 * Applies a function to each element in the given Vector and returns a
 * new Vector of the values that the function return.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Vector<A>): Vector<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * Applies a function to each element in the given Vector and returns a
 * new Vector of the values that the function return.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector mapWithIndex
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: Vector<A>): Vector<B> => {
    return new Vector(
      self.bits,
      self.offset,
      self.length,
      mapPrefix(f, self.prefix, getPrefixSize(self)),
      self.root === undefined ? undefined : mapNode(f, self.root, getDepth(self), getPrefixSize(self), 1)[0],
      mapAffix(f, self.suffix, getSuffixSize(self), self.length),
    );
  };
}

/**
 * @tsplus getter fncts.Vector mutableClone
 */
export function mutableClone<A>(self: Vector<A>): MutableVector<A> {
  return new Vector(self.bits, self.offset, self.length, self.prefix, self.root, self.suffix) as any;
}

/**
 * Returns a Vector that has the entry specified by the index replaced with
 * the value returned by applying the function to the value.
 *
 * If the index is out of bounds the given Vector is
 * returned unchanged.
 *
 * @complexity `O(log(n))`
 *
 * @tsplus pipeable fncts.Vector modifyAt
 */
export function modifyAt<A>(i: number, f: (a: A) => A) {
  return (self: Vector<A>): Vector<A> => {
    if (i < 0 || self.length <= i) {
      return self;
    }
    return self.updateAt(i, f(self.unsafeGet(i)!));
  };
}

/**
 * Returns `true` if and only if the predicate function returns
 * `false` for every element in the given Vector.
 *
 * @complexity O(n)
 *
 * @tsplus pipeable fncts.Vector none
 */
export function none<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): boolean => {
    return !self.some(predicate);
  };
}

/**
 * Takes two arguments and returns a Vector that contains them.
 *
 * @complexity O(1)
 * @tsplus static fncts.VectorOps pair
 */
export function pair<A>(first: A, second: A): Vector<A> {
  return new Vector(2, 0, 2, emptyAffix, undefined, [first, second]);
}

/**
 * Returns a new Vector with the last element removed. If the Vector is
 * empty the empty Vector is returned.
 *
 * @complexity `O(1)`
 * @tsplus getter fncts.Vector pop
 */
export function pop<A>(self: Vector<A>): Vector<A> {
  return self.slice(0, -1);
}

/**
 * Prepends an element to the front of a Vector and returns the new Vector.
 *
 * @complexity O(1)
 *
 * @tsplus pipeable fncts.Vector prepend
 */
export function prepend<A>(a: A) {
  return (self: Vector<A>): Vector<A> => {
    const prefixSize = getPrefixSize(self);
    if (prefixSize < 32) {
      return new Vector<A>(
        incrementPrefix(self.bits),
        self.offset,
        self.length + 1,
        affixPush(a, self.prefix, prefixSize),
        self.root,
        self.suffix,
      );
    } else {
      const newVector = mutableClone(self);
      prependNodeToTree(newVector, reverseArray(self.prefix));
      const newPrefix  = [a];
      newVector.prefix = newPrefix;
      newVector.length++;
      newVector.bits = setPrefix(1, newVector.bits);
      return newVector;
    }
  };
}

/**
 * @tsplus operator fncts.Vector +
 */
export function prependOperator<A>(a: A, self: Vector<A>): Vector<A> {
  return self.prepend(a);
}

/**
 * Returns a Vector of numbers between an inclusive lower bound and an exclusive upper bound.
 *
 * @complexity O(n)
 * @tsplus static fncts.VectorOps range
 */
export function range(start: number, end: number): Vector<number> {
  const vec = emptyPushable<number>();
  for (let i = start; i < end; ++i) {
    vec.push(i);
  }
  return vec;
}

/**
 * Takes an index, a number of elements to remove and a Vector. Returns a
 * new Vector with the given amount of elements removed from the specified
 * index.
 *
 * @complexity `O(log(n))`
 *
 * @tsplus pipeable fncts.Vector remove
 */
export function remove(from: number, amount: number) {
  return <A>(self: Vector<A>): Vector<A> => {
    return self.slice(0, from).concat(self.slice(from + amount, self.length));
  };
}

/**
 * Returns a Vector of a given length that contains the specified value
 * in all positions.
 *
 * @complexity O(n)
 * @tsplus static fncts.VectorOps replicate
 */
export function replicate<A>(n: number, a: A): Vector<A> {
  let t   = n;
  const l = emptyPushable<A>();
  while (--t >= 0) {
    l.push(a);
  }
  return l;
}

/**
 * @tsplus getter fncts.Vector reverse
 */
export function reverse<A>(self: Vector<A>): Vector<A> {
  return self.foldLeft(Vector.empty(), (vec, elem) => vec.prepend(elem));
}

/**
 * Folds a function over a Vector from left to right while collecting
 * all the intermediate steps in a resulting Vector.
 *
 * @tsplus pipeable fncts.Vector scanLeft
 */
export function scanLeft<A, B>(initial: B, f: (acc: B, value: A) => B) {
  return (self: Vector<A>): Vector<B> => {
    return self.foldLeft(emptyPushable<B>().push(initial), (l2, a) => l2.push(f((l2 as Vector<B>).unsafeLast!, a)));
  };
}

/**
 * Takes a single arguments and returns a singleton Vector that contains it.
 *
 * @complexity O(1)
 * @tsplus static fncts.VectorOps single
 */
export function single<A>(a: A): Vector<A> {
  return Vector(a);
}

/**
 * Returns a slice of a Vector. Elements are removed from the beginning and
 * end. Both the indices can be negative in which case they will count
 * from the right end of the Vector.
 *
 * @complexity `O(log(n))`
 * @tsplus pipeable fncts.Vector slice
 */
export function slice(from: number, to: number) {
  return <A>(self: Vector<A>): Vector<A> => {
    let { bits, length } = self;
    let _to              = to;
    let _from            = from;
    _to                  = Math.min(length, to);
    // Handle negative indices
    if (_from < 0) {
      _from = length + from;
    }
    if (_to < 0) {
      _to = length + to;
    }
    // Should we just return the empty Vector?
    if (_to <= _from || _to <= 0 || length <= _from) {
      return empty();
    }
    // Return Vector unchanged if we are slicing nothing off
    if (_from <= 0 && length <= _to) {
      return self;
    }
    const newLength  = _to - _from;
    let prefixSize   = getPrefixSize(self);
    const suffixSize = getSuffixSize(self);
    // Both indices lie in the prefix
    if (_to <= prefixSize) {
      return new Vector(
        setPrefix(newLength, 0),
        0,
        newLength,
        self.prefix.slice(prefixSize - _to, prefixSize - _from),
        undefined,
        emptyAffix,
      );
    }
    const suffixStart = length - suffixSize;
    // Both indices lie in the suffix
    if (suffixStart <= _from) {
      return new Vector(
        setSuffix(newLength, 0),
        0,
        newLength,
        emptyAffix,
        undefined,
        self.suffix.slice(_from - suffixStart, _to - suffixStart),
      );
    }
    const newVector  = mutableClone(self);
    newVector.length = newLength;
    // Both indices lie in the tree
    if (prefixSize <= _from && _to <= suffixStart) {
      sliceTreeVector(
        _from - prefixSize + self.offset,
        _to - prefixSize + self.offset - 1,
        self.root!,
        getDepth(self),
        self.offset,
        newVector,
      );
      return newVector;
    }
    if (0 < _from) {
      // we need _to slice something off of the left
      if (_from < prefixSize) {
        // shorten the prefix even though it's not strictly needed,
        // so that referenced items can be GC'd
        newVector.prefix = self.prefix.slice(0, prefixSize - _from);
        bits             = setPrefix(prefixSize - _from, bits);
      } else {
        // if we're here `_to` can't lie in the tree, so we can set the
        // root
        zeroOffset();
        newVector.root   = sliceLeft(newVector.root!, getDepth(self), _from - prefixSize, self.offset, true);
        newVector.offset = newOffset;
        if (newVector.root === undefined) {
          bits = setDepth(0, bits);
        }
        bits             = setPrefix(newAffix.length, bits);
        prefixSize       = newAffix.length;
        newVector.prefix = newAffix;
      }
    }
    if (_to < length) {
      // we need _to slice something off of the right
      if (length - _to < suffixSize) {
        bits = setSuffix(suffixSize - (length - _to), bits);
        // slice the suffix even though it's not strictly needed,
        // _to allow the removed items _to be GC'd
        newVector.suffix = self.suffix.slice(0, suffixSize - (length - _to));
      } else {
        newVector.root = sliceRight(newVector.root!, getDepth(self), _to - prefixSize - 1, newVector.offset);
        if (newVector.root === undefined) {
          bits             = setDepth(0, bits);
          newVector.offset = 0;
        }
        bits             = setSuffix(newAffix.length, bits);
        newVector.suffix = newAffix;
      }
    }
    newVector.bits = bits;
    return newVector;
  };
}

/**
 * @tsplus pipeable fncts.Vector sort
 */
export function sort<A>(/** @tsplus auto */ O: Ord<A>) {
  return (self: Vector<A>): Vector<A> => {
    return self.sortWith((a, b) => O.compare(b)(a));
  };
}

/**
 * Sort the given Vector by comparing values using the given function.
 * The function receieves two values and should return `-1` if the
 * first value is stricty larger than the second, `0` is they are
 * equal and `1` if the first values is strictly smaller than the
 * second.
 *
 * @complexity O(n * log(n))
 *
 * @tsplus pipeable fncts.Vector sortWith
 */
export function sortWith<A>(compare: (a: A, b: A) => Ordering) {
  return (self: Vector<A>): Vector<A> => {
    const arr: {
      idx: number;
      elm: A;
    }[] = [];
    let i = 0;
    self.forEach((elm) => arr.push({ idx: i++, elm }));
    arr.sort(({ elm: a, idx: i }, { elm: b, idx: j }) => {
      const c = compare(a, b);
      return c !== 0 ? c : i < j ? -1 : 1;
    });
    const newL = emptyPushable<A>();
    for (let i = 0; i < arr.length; ++i) {
      newL.push(arr[i]!.elm);
    }
    return newL;
  };
}

/**
 * Splits a Vector at the given index and return the two sides in a pair.
 * The left side will contain all elements before but not including the
 * element at the given index. The right side contains the element at the
 * index and all elements after it.
 *
 * @complexity `O(log(n))`
 *
 * @tsplus pipeable fncts.Vector splitAt
 */
export function splitAt(index: number) {
  return <A>(self: Vector<A>): [Vector<A>, Vector<A>] => {
    return [self.slice(0, index), self.slice(index, self.length)];
  };
}

/**
 * Splits a Vector at the first element in the Vector for which the given
 * predicate returns `true`.
 *
 * @complexity `O(n)`
 *
 * @tsplus pipeable fncts.Vector splitWhen
 */
export function splitWhen<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): [Vector<A>, Vector<A>] => {
    const idx = self.findIndex(predicate);
    return idx === -1 ? [self, Vector.empty()] : self.splitAt(idx);
  };
}

/**
 * Returns a new Vector with the first element removed. If the Vector is
 * empty the empty Vector is returned.
 *
 * @complexity `O(1)`
 *
 * @tsplus getter fncts.Vector tail
 */
export function tail<A>(self: Vector<A>): Vector<A> {
  return self.slice(1, self.length);
}

/**
 * Takes the first `n` elements from a Vector and returns them in a new Vector.
 *
 * @complexity `O(log(n))`
 * @tsplus pipeable fncts.Vector take
 */
export function take(n: number) {
  return <A>(self: Vector<A>): Vector<A> => {
    return self.slice(0, n);
  };
}

/**
 * Takes the first elements in the Vector for which the predicate returns
 * `true`.
 *
 * @complexity `O(k + log(n))` where `k` is the number of elements satisfying
 * the predicate.
 *
 * @tsplus pipeable fncts.Vector takeWhile
 */
export function takeWhile<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): Vector<A> => {
    const { index } = foldLeftCb(findNotIndexCb, { predicate, index: 0 }, self);
    return self.slice(0, index);
  };
}

/**
 * Takes the last `n` elements from a Vector and returns them in a new
 * Vector.
 *
 * @complexity `O(log(n))`
 * @tsplus pipeable fncts.Vector takeLast
 */
export function takeLast(n: number) {
  return <A>(self: Vector<A>): Vector<A> => {
    return self.slice(self.length - n, self.length);
  };
}

/**
 * Takes the last elements in the Vector for which the predicate returns
 * `true`.
 *
 * @complexity `O(k + log(n))` where `k` is the number of elements
 * satisfying the predicate.
 *
 * @tsplus pipeable fncts.Vector takeLastWhile
 */
export function takeLastWhile<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): Vector<A> => {
    const { index } = foldRightCb(findNotIndexCb, { predicate, index: 0 }, self);
    return self.slice(self.length - index, self.length);
  };
}

/**
 * Converts a Vector into an array.
 *
 * @complexity `O(n)`
 * @tsplus getter fncts.Vector toArray
 */
export function toArray<A>(self: Vector<A>): ReadonlyArray<A> {
  return self.foldLeft<A, A[]>([], arrayPush);
}

/**
 * Converts a Vector into a List.
 *
 * @complexity `O(n)`
 * @tsplus getter fncts.Vector toList
 */
export function toList<A>(self: Vector<A>): List<A> {
  const buffer = new ListBuffer<A>();
  self.forEach((a) => {
    buffer.append(a);
  });
  return buffer.toList;
}

/**
 * @tsplus getter fncts.Vector traverseWithIndex
 */
export function _traverseWithIndex<A>(
  self: Vector<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Vector<B>>;
export function _traverseWithIndex<A>(
  self: Vector<A>,
): <G>(G: P.Applicative<HKT.F<G>>) => <B>(f: (i: number, a: A) => HKT.FK1<G, B>) => HKT.FK1<G, Vector<B>> {
  return (G) => (f) =>
    self.foldLeftWithIndex(G.pure(Vector.emptyPushable()), (i, b, a) =>
      b.pipe(
        G.zipWith(f(i, a), (v, b) => {
          v.push(b);
          return v;
        }),
      ),
    );
}

/**
 * @tsplus getter fncts.Vector traverse
 */
export function _traverse<A>(self: Vector<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Vector<B>> =>
      self.traverseWithIndex(G)((_, a) => f(a));
}

export const traverseWithIndex: P.TraversableWithIndex<VectorF>["traverseWithIndex"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)(f);

export const traverse: Traversable<VectorF>["traverse"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)((_, a) => f(a));

/**
 * Returns a new Vector without repeated elements by using the given
 * Eq instance to determine when elements are equal
 *
 * @complexity `O(n)`
 * @tsplus pipeable fncts.Vector uniq
 */
export function uniq<A>(E: Eq<A>) {
  return (self: Vector<A>) => self.dropRepeatsWith((a, b) => E.equals(b)(a));
}

/**
 * @tsplus static fncts.VectorOps unfold
 */
export function unfold<A, B>(b: B, f: (b: B) => Maybe<readonly [A, B]>): Vector<A> {
  const out = emptyPushable<A>();
  let state = b;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const mt = f(state);
    if (mt.isJust()) {
      const [a, b] = mt.value;
      out.push(a);
      state = b;
    } else {
      break;
    }
  }
  return out;
}

function findCb<A>(value: A, state: PredState): boolean {
  if (state.predicate(value)) {
    state.result = value;
    return false;
  } else {
    return true;
  }
}

/**
 * Returns the _first_ element for which the predicate returns `true`.
 * If no such element is found the function returns `undefined`.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector unsafeFind
 */
export function unsafeFind<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): A | undefined => {
    return foldLeftCb<A, PredState>(findCb, { predicate, result: undefined }, self).result;
  };
}

/**
 * Returns the _last_ element for which the predicate returns `true`.
 * If no such element is found the function returns `undefined`.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector unsafeFindLast
 */
export function unsafeFindLast<A>(predicate: Predicate<A>) {
  return (self: Vector<A>): A | undefined => {
    return foldRightCb<A, PredState>(findCb, { predicate, result: undefined }, self).result;
  };
}

/**
 * Gets the nth element of the Vector. If `n` is out of bounds
 * `undefined` is returned.
 *
 * @complexity O(log(n))
 * @tsplus pipeable fncts.Vector unsafeGet
 * @tsplus pipeable-index fncts.Vector
 */
export function unsafeGet(index: number) {
  return <A>(self: Vector<A>): A | undefined => {
    if (index < 0 || self.length <= index) {
      return undefined;
    }
    const prefixSize = getPrefixSize(self);
    const suffixSize = getSuffixSize(self);
    if (index < prefixSize) {
      return self.prefix[prefixSize - index - 1];
    } else if (index >= self.length - suffixSize) {
      return self.suffix[index - (self.length - suffixSize)];
    }
    const { offset } = self;
    const depth      = getDepth(self);
    return self.root!.sizes === undefined
      ? nodeNthDense(
          self.root!,
          depth,
          offset === 0 ? index - prefixSize : handleOffset(depth, offset, index - prefixSize),
        )
      : nodeNth(self.root!, depth, offset, index - prefixSize);
  };
}

/**
 * Returns the first element of the Vector. If the Vector is empty the
 * function returns undefined.
 *
 * @complexity O(1)
 * @tsplus getter fncts.Vector unsafeHead
 */
export function unsafeHead<A>(self: Vector<A>): A | undefined {
  const prefixSize = getPrefixSize(self);
  return prefixSize !== 0 ? self.prefix[prefixSize - 1] : self.length !== 0 ? self.suffix[0] : undefined;
}

/**
 * Returns the last element of the Vector. If the Vector is empty the
 * function returns `undefined`.
 *
 * @complexity O(1)
 * @tsplus getter fncts.Vector unsafeLast
 */
export function unsafeLast<A>(self: Vector<A>): A | undefined {
  const suffixSize = getSuffixSize(self);
  return suffixSize !== 0 ? self.suffix[suffixSize - 1] : self.length !== 0 ? self.prefix[0] : undefined;
}

/**
 * Returns a Vector that has the entry specified by the index replaced with the given value.
 *
 * If the index is out of bounds the given Vector is returned unchanged.
 *
 * @complexity O(log(n))
 * @tsplus pipeable fncts.Vector updateAt
 */
export function updateAt<A>(i: number, a: A) {
  return (self: Vector<A>): Vector<A> => {
    if (i < 0 || self.length <= i) {
      return self;
    }
    const prefixSize = getPrefixSize(self);
    const suffixSize = getSuffixSize(self);
    const newVector  = mutableClone(self);
    if (i < prefixSize) {
      const newPrefix                     = copyArray(newVector.prefix);
      newPrefix[newPrefix.length - i - 1] = a;
      newVector.prefix                    = newPrefix;
    } else if (i >= self.length - suffixSize) {
      const newSuffix = copyArray(newVector.suffix);
      newSuffix[i - (self.length - suffixSize)] = a;
      newVector.suffix = newSuffix;
    } else {
      newVector.root = updateNode(self.root!, getDepth(self), i - prefixSize, self.offset, a);
    }
    return newVector;
  };
}

/**
 * @tsplus static fncts.VectorOps __call
 */
export function vector<A>(...elements: ReadonlyArray<A>): Vector<A> {
  const v = Vector.emptyPushable<A>();
  for (const element of elements) {
    v.push(element);
  }
  return v;
}
