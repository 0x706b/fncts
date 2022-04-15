/* eslint-disable prefer-const */
import type { MutableVector } from "@fncts/base/collection/immutable/Vector/definition";
import type { Eq, Monoid, Ord, Ordering } from "@fncts/base/typeclass";

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
 * @tsplus fluent fncts.Vector append
 */
export function append_<A>(as: Vector<A>, a: A): Vector<A> {
  const suffixSize = getSuffixSize(as);
  if (suffixSize < 32) {
    return new Vector(
      incrementSuffix(as.bits),
      as.offset,
      as.length + 1,
      as.prefix,
      as.root,
      affixPush(a, as.suffix, suffixSize),
    );
  }
  const newSuffix = [a];
  const newVector = mutableClone(as);
  appendNodeToTree(newVector, as.suffix);
  newVector.suffix = newSuffix;
  newVector.length++;
  newVector.bits = setSuffix(1, newVector.bits);
  return newVector;
}

/**
 * Maps a function over a Vector and concatenates all the resulting
 * Vectors together.
 *
 * @tsplus fluent fncts.Vector chain
 */
export function chain_<A, B>(ma: Vector<A>, f: (a: A) => Vector<B>): Vector<B> {
  return ma.map(f).flatten;
}

/**
 * Splits the Vector into chunks of the given size.
 *
 * @tsplus fluent fncts.Vector chunksOf
 */
export function chunksOf_<A>(as: Vector<A>, size: number): Vector<Vector<A>> {
  const { buffer, l2 } = as.foldLeft(
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
}

/**
 * Concatenates two Vectors.
 *
 * @complexity O(log(n))
 * @tsplus fluent fncts.Vector concat
 */
export function concat_<A, B>(self: Vector<A>, that: Vector<B>): Vector<A | B>;
export function concat_<A>(self: Vector<A>, that: Vector<A>): Vector<A> {
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
 * @tsplus fluent fncts.Vector contains
 */
export function contains_<A>(as: Vector<A>, element: A): boolean {
  containsState.element = element;
  containsState.result  = false;
  return foldLeftCb(containsCb, containsState, as).result;
}

/**
 * Returns a new Vector without the first `n` elements.
 *
 * @complexity `O(log(n))`
 * @tsplus fluent fncts.Vector drop
 */
export function drop_<A>(as: Vector<A>, n: number): Vector<A> {
  return as.slice(n, as.length);
}

/**
 * Returns a new Vector without the last `n` elements.
 *
 * @complexity `O(log(n))`
 * @tsplus fluent fncts.Vector dropLast
 */
export function dropLast_<A>(as: Vector<A>, n: number): Vector<A> {
  return as.slice(0, as.length - n);
}

/**
 * Returns a new Vector without repeated elements.
 *
 * @complexity `O(n)`
 * @tsplus getter fncts.Vector dropRepeats
 */
export function dropRepeats<A>(as: Vector<A>): Vector<A> {
  return as.dropRepeatsWith(Equatable.strictEquals);
}

/**
 * Returns a new Vector without repeated elements by using the given
 * function to determine when elements are equal.
 *
 * @complexity `O(n)`
 * @tsplus fluent fncts.Vector dropRepeatsWith
 */
export function dropRepeatsWith_<A>(as: Vector<A>, predicate: (a: A, b: A) => boolean): Vector<A> {
  return as.foldLeft(Vector.emptyPushable(), (acc, a) =>
    acc.length !== 0 && predicate((acc as Vector<A>).unsafeLast!, a) ? acc : acc.push(a),
  );
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
 * @tsplus fluent fncts.Vector dropWhile
 */
export function dropWhile_<A>(as: Vector<A>, predicate: Predicate<A>): Vector<A> {
  const { index } = foldLeftCb(findNotIndexCb, { predicate, index: 0 }, as);
  return as.slice(index, as.length);
}

type ElemState = {
  element: any;
  equals: (x: any, y: any) => boolean;
  result: boolean;
};

function elemCb(value: any, state: ElemState): boolean {
  return !(state.result = state.equals(value, state.element));
}

/**
 * @tsplus getter fncts.Vector elem
 */
export function elem_<A>(self: Vector<A>) {
  return (E: Eq<A>) => {
    const elemState: ElemState = { equals: E.equals_, element: undefined, result: false };
    return (a: A): boolean => {
      elemState.element = a;
      return foldLeftCb(elemCb, elemState, self).result;
    };
  };
}

/**
 * Returns true if the two Vectors are equivalent.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector equals
 */
export function equals_<A>(self: Vector<A>, that: Vector<A>): boolean {
  return self.corresponds(that, Equatable.strictEquals);
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
 * @tsplus fluent fncts.Vector every
 */
export function every_<A, B extends A>(as: Vector<A>, refinement: Refinement<A, B>): as is Vector<B>;
export function every_<A>(as: Vector<A>, predicate: Predicate<A>): boolean;
export function every_<A>(as: Vector<A>, predicate: Predicate<A>): boolean {
  return foldLeftCb<A, PredState>(everyCb, { predicate, result: true }, as).result;
}

/**
 * Creates an empty Vector.
 *
 * @complexity O(1)
 * @tsplus static fncts.VectorOps empty
 */
export function empty<A = any>(): Vector<A> {
  return new Vector(0, 0, 0, emptyAffix, undefined, emptyAffix);
}

/**
 * @tsplus static fncts.VectorOps emptyPushable
 */
export function emptyPushable<A>(): MutableVector<A> {
  return new Vector(0, 0, 0, [], undefined, []) as any;
}

function existsCb<A>(value: A, state: PredState): boolean {
  return !(state.result = state.predicate(value));
}

/**
 * Returns true if and only if there exists an element in the Vector for
 * which the predicate returns true.
 *
 * @complexity O(n)
 *
 * @tsplus fluent fncts.Vector exists
 */
export function exists_<A>(as: Vector<A>, predicate: Predicate<A>): boolean {
  return foldLeftCb<A, PredState>(existsCb, { predicate, result: false }, as).result;
}

/**
 * Returns the _first_ element for which the predicate returns `true`.
 * If no such element is found the function returns `undefined`.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector find
 */
export function find_<A>(as: Vector<A>, predicate: Predicate<A>): Maybe<A> {
  return Maybe.fromNullable(as.unsafeFind(predicate));
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
 * @tsplus fluent fncts.Vector findIndex
 */
export function findIndex_<A>(as: Vector<A>, predicate: Predicate<A>): number {
  const { found, index } = foldLeftCb<A, FindIndexState>(findIndexCb, { predicate, found: false, index: -1 }, as);
  return found ? index : -1;
}

/**
 * Returns the _last_ element for which the predicate returns `true`.
 * If no such element is found the function returns `undefined`.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector findLast
 */
export function findLast_<A>(as: Vector<A>, predicate: Predicate<A>): Maybe<A> {
  return Maybe.fromNullable(as.unsafeFindLast(predicate));
}

/**
 * Returns the index of the `last` element for which the predicate
 * returns true. If no such element is found the function returns
 * `-1`.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector findLastIndex
 */
export function findLastIndex_<A>(as: Vector<A>, predicate: Predicate<A>): number {
  const { found, index } = foldRightCb<A, FindIndexState>(findIndexCb, { predicate, found: false, index: -0 }, as);
  return found ? index : -1;
}

/**
 * Flattens a Vector of Vectors into a Vector. Note that this function does
 * not flatten recursively. It removes one level of nesting only.
 *
 * @complexity O(n * log(m)), where n is the length of the outer Vector and m the length of the inner Vectors.
 *
 * @tsplus getter fncts.Vector flatten
 */
export function flatten<A>(mma: Vector<Vector<A>>): Vector<A> {
  return mma.foldLeft<Vector<A>, Vector<A>>(Vector.empty(), (acc, a) => acc.concat(a));
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
 * @tsplus fluent fncts.Vector foldLeft
 */
export function foldLeft_<A, B>(fa: Vector<A>, initial: B, f: (acc: B, a: A) => B): B {
  return fa.foldLeftWithIndex(initial, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.Vector foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(fa: Vector<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  const suffixSize = getSuffixSize(fa);
  const prefixSize = getPrefixSize(fa);
  let [acc, index] = foldLeftPrefix(f, b, fa.prefix, prefixSize);
  if (fa.root !== undefined) {
    [acc, index] = foldLeftNode(f, acc, fa.root, getDepth(fa), index);
  }
  return foldLeftSuffix(f, acc, fa.suffix, suffixSize, index)[0];
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
 * @tsplus fluent fncts.Vector foldLeftWhile
 */
export function foldLeftWhile_<A, B>(fa: Vector<A>, b: B, cont: Predicate<B>, f: (i: number, b: B, a: A) => B): B {
  if (!cont(b)) {
    return b;
  }
  return foldLeftCb<A, FoldWhileState<A, B>>(foldWhileCb, { predicate: cont, f, result: b }, fa).result;
}

/**
 * @tsplus fluent fncts.Vector foldRightWhile
 */
export function foldRightWhile_<A, B>(fa: Vector<A>, b: B, cont: Predicate<B>, f: (i: number, a: A, b: B) => B): B {
  return foldRightCb<A, FoldWhileState<A, B>>(
    foldWhileCb,
    { predicate: cont, result: b, f: (i, b, a) => f(i, a, b) },
    fa,
  ).result;
}

/**
 * @tsplus getter fncts.Vector foldMap
 */
export function foldMap_<A>(self: Vector<A>) {
  return <M>(M: Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.Vector foldMapWithIndex
 */
export function foldMapWithIndex_<A>(self: Vector<A>) {
  return <M>(M: Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine_(b, f(i, a)));
}

/**
 * Folds a function over a Vector. Right-associative.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector foldRight
 */
export function foldRight_<A, B>(fa: Vector<A>, initial: B, f: (value: A, acc: B) => B): B {
  return fa.foldRightWithIndex(initial, (_, a, b) => f(a, b));
}

/**
 * Folds a function over a Vector. Right-associative.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(fa: Vector<A>, b: B, f: (i: number, a: A, b: B) => B): B {
  const suffixSize = getSuffixSize(fa);
  const prefixSize = getPrefixSize(fa);
  let [acc, j]     = foldRightSuffix(f, b, fa.suffix, suffixSize, fa.length - 1);
  if (fa.root !== undefined) {
    [acc, j] = foldRightNode(f, acc, fa.root, getDepth(fa), j);
  }
  return foldRightPrefix(f, acc, fa.prefix, prefixSize, j)[0];
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
 * @tsplus fluent fncts.Vector forEach
 */
export function forEach_<A>(as: Vector<A>, f: (a: A) => void): void {
  as.foldLeft(undefined as void, (_, element) => f(element));
}

/**
 * @tsplus fluent fncts.Vector forEachWithIndex
 */
export function forEachWithIndex_<A>(as: Vector<A>, f: (i: number, a: A) => void): void {
  as.foldLeftWithIndex(undefined as void, (index, _, element) => f(index, element));
}

/**
 * Gets the nth element of the Vector. If `n` is out of bounds
 * `undefined` is returned.
 *
 * @complexity O(log(n))
 * @tsplus fluent fncts.Vector get
 */
export function get_<A>(self: Vector<A>, index: number): Maybe<A> {
  return Maybe.fromNullable(self.unsafeGet(index));
}

/**
 * Returns a Vector of Vectors where each subvector's elements are pairwise
 * equal based on the given comparison function.
 *
 * Note that only adjacent elements are compared for equality. If all
 * equal elements should be grouped together the Vector should be sorted
 * before grouping.
 *
 * @tsplus fluent fncts.Vector groupWith
 */
export function groupWith_<A>(as: Vector<A>, f: (a: A, b: A) => boolean): Vector<Vector<A>> {
  const result = Vector.emptyPushable<MutableVector<A>>();
  let buffer   = Vector.emptyPushable<A>();
  forEach_(as, (a) => {
    if (buffer.length !== 0 && !f(unsafeLast(buffer)!, a)) {
      result.push(buffer);
      buffer = emptyPushable();
    }
    buffer.push(a);
  });
  return buffer.length === 0 ? result : result.push(buffer);
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
 * @tsplus fluent fncts.Vector indexOf
 */
export function indexOf_<A>(as: Vector<A>, element: A): number {
  const state = { element, found: false, index: -1 };
  foldLeftCb(indexOfCb, state, as);
  return state.found ? state.index : -1;
}

/**
 * Inserts the given element at the given index in the Vector.
 *
 * @complexity O(log(n))
 * @tsplus fluent fncts.Vector insertAt
 */
export function insertAt_<A>(as: Vector<A>, index: number, element: A): Vector<A> {
  return as.slice(0, index).append(element).concat(as.slice(index, as.length));
}

/**
 * Inserts the given Vector of elements at the given index in the Vector.
 *
 * @complexity `O(log(n))`
 * @tsplus fluent fncts.Vector insertAllAt
 */
export function insertAllAt_<A>(as: Vector<A>, index: number, elements: Vector<A>): Vector<A> {
  return as.slice(0, index).concat(elements).concat(as.slice(index, as.length));
}

/**
 * Inserts a separator between each element in a Vector.
 *
 * @tsplus fluent fncts.Vector intersperse
 */
export function intersperse_<A>(as: Vector<A>, separator: A): Vector<A> {
  return (as.foldLeft(Vector.emptyPushable(), (l2, a) => l2.push(a).push(separator)) as Vector<A>).pop;
}

/**
 * @tsplus fluent fncts.Vector isEmpty
 */
export function isEmpty<A>(l: Vector<A>): boolean {
  return l.length === 0;
}

/**
 * @tsplus fluent fncts.Vector isNonEmpty
 */
export function isNonEmpty<A>(l: Vector<A>): boolean {
  return l.length > 0;
}

/**
 * Concatenates the strings in the Vector separated by a specified separator.
 *
 * @tsplus fluent fncts.Vector join
 */
export function join_(as: Vector<string>, separator: string): string {
  return as.foldLeft("", (a, b) => (a.length === 0 ? b : a + separator + b));
}

/**
 * Returns the last element of the Vector.
 *
 * @complexity O(1)
 * @tsplus getter fncts.Vector last
 */
export function last<A>(l: Vector<A>): Maybe<NonNullable<A>> {
  return Maybe.fromNullable(l.unsafeLast);
}

/**
 * Returns the index of the _last_ element in the Vector that is equal
 * to the given element. If no such element is found `-1` is returned.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector lastIndexOf
 */
export function lastIndexOf_<A>(as: Vector<A>, element: A): number {
  const state = { element, found: false, index: 0 };
  foldRightCb(indexOfCb, state, as);
  return state.found ? as.length - state.index : -1;
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
 * @tsplus fluent fncts.Vector mapAccum
 */
export function mapAccum_<A, S, B>(fa: Vector<A>, s: S, f: (s: S, a: A) => readonly [B, S]): readonly [Vector<B>, S] {
  return fa.foldLeft([Vector.emptyPushable(), s], ([acc, s], a) => {
    const r = f(s, a);
    acc.push(r[0]);
    return [acc, r[1]];
  });
}

/**
 * Applies a function to each element in the given Vector and returns a
 * new Vector of the values that the function return.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector map
 */
export function map_<A, B>(fa: Vector<A>, f: (a: A) => B): Vector<B> {
  return fa.mapWithIndex((_, a) => f(a));
}

/**
 * Applies a function to each element in the given Vector and returns a
 * new Vector of the values that the function return.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector mapWithIndex
 */
export function mapWithIndex_<A, B>(fa: Vector<A>, f: (i: number, a: A) => B): Vector<B> {
  return new Vector(
    fa.bits,
    fa.offset,
    fa.length,
    mapPrefix(f, fa.prefix, getPrefixSize(fa)),
    fa.root === undefined ? undefined : mapNode(f, fa.root, getDepth(fa), getPrefixSize(fa), 1)[0],
    mapAffix(f, fa.suffix, getSuffixSize(fa), fa.length),
  );
}

/**
 * @tsplus getter fncts.Vector mutableClone
 */
export function mutableClone<A>(as: Vector<A>): MutableVector<A> {
  return new Vector(as.bits, as.offset, as.length, as.prefix, as.root, as.suffix) as any;
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
 * @tsplus fluent fncts.Vector modifyAt
 */
export function modifyAt_<A>(as: Vector<A>, i: number, f: (a: A) => A): Vector<A> {
  if (i < 0 || as.length <= i) {
    return as;
  }
  return as.updateAt(i, f(as.unsafeGet(i)!));
}

/**
 * Returns `true` if and only if the predicate function returns
 * `false` for every element in the given Vector.
 *
 * @complexity O(n)
 *
 * @tsplus fluent fncts.Vector none
 */
export function none_<A>(as: Vector<A>, predicate: Predicate<A>): boolean {
  return !as.exists(predicate);
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
export function pop<A>(as: Vector<A>): Vector<A> {
  return as.slice(0, -1);
}

/**
 * Prepends an element to the front of a Vector and returns the new Vector.
 *
 * @complexity O(1)
 *
 * @tsplus fluent fncts.Vector prepend
 */
export function prepend_<A>(as: Vector<A>, a: A): Vector<A> {
  const prefixSize = getPrefixSize(as);
  if (prefixSize < 32) {
    return new Vector<A>(
      incrementPrefix(as.bits),
      as.offset,
      as.length + 1,
      affixPush(a, as.prefix, prefixSize),
      as.root,
      as.suffix,
    );
  } else {
    const newVector = mutableClone(as);
    prependNodeToTree(newVector, reverseArray(as.prefix));
    const newPrefix  = [a];
    newVector.prefix = newPrefix;
    newVector.length++;
    newVector.bits = setPrefix(1, newVector.bits);
    return newVector;
  }
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
 * @tsplus fluent fncts.Vector remove
 */
export function remove_<A>(as: Vector<A>, from: number, amount: number): Vector<A> {
  return as.slice(0, from).concat(as.slice(from + amount, as.length));
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
 * Folds a function over a Vector from left to right while collecting
 * all the intermediate steps in a resulting Vector.
 *
 * @tsplus fluent fncts.Vector scanLeft
 */
export function scanLeft_<A, B>(as: Vector<A>, initial: B, f: (acc: B, value: A) => B): Vector<B> {
  return as.foldLeft(emptyPushable<B>().push(initial), (l2, a) => l2.push(f((l2 as Vector<B>).unsafeLast!, a)));
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
 * @tsplus fluent fncts.Vector slice
 */
export function slice_<A>(as: Vector<A>, from: number, to: number): Vector<A> {
  let { bits, length } = as;
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
    return as;
  }

  const newLength  = _to - _from;
  let prefixSize   = getPrefixSize(as);
  const suffixSize = getSuffixSize(as);

  // Both indices lie in the prefix
  if (_to <= prefixSize) {
    return new Vector(
      setPrefix(newLength, 0),
      0,
      newLength,
      as.prefix.slice(prefixSize - _to, prefixSize - _from),
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
      as.suffix.slice(_from - suffixStart, _to - suffixStart),
    );
  }

  const newVector  = mutableClone(as);
  newVector.length = newLength;

  // Both indices lie in the tree
  if (prefixSize <= _from && _to <= suffixStart) {
    sliceTreeVector(
      _from - prefixSize + as.offset,
      _to - prefixSize + as.offset - 1,
      as.root!,
      getDepth(as),
      as.offset,
      newVector,
    );
    return newVector;
  }

  if (0 < _from) {
    // we need _to slice something off of the left
    if (_from < prefixSize) {
      // shorten the prefix even though it's not strictly needed,
      // so that referenced items can be GC'd
      newVector.prefix = as.prefix.slice(0, prefixSize - _from);
      bits             = setPrefix(prefixSize - _from, bits);
    } else {
      // if we're here `_to` can't lie in the tree, so we can set the
      // root
      zeroOffset();
      newVector.root   = sliceLeft(newVector.root!, getDepth(as), _from - prefixSize, as.offset, true);
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
      newVector.suffix = as.suffix.slice(0, suffixSize - (length - _to));
    } else {
      newVector.root = sliceRight(newVector.root!, getDepth(as), _to - prefixSize - 1, newVector.offset);
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
}

/**
 * @tsplus getter fncts.Vector sort
 */
export function sort_<A>(self: Vector<A>) {
  return (O: Ord<A>): Vector<A> => self.sortWith(O.compare_);
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
 * @tsplus fluent fncts.Vector sortWith
 */
export function sortWith_<A>(as: Vector<A>, compare: (a: A, b: A) => Ordering): Vector<A> {
  const arr: { idx: number; elm: A }[] = [];
  let i = 0;
  as.forEach((elm) => arr.push({ idx: i++, elm }));
  arr.sort(({ elm: a, idx: i }, { elm: b, idx: j }) => {
    const c = compare(a, b);
    return c !== 0 ? c : i < j ? -1 : 1;
  });
  const newL = emptyPushable<A>();
  for (let i = 0; i < arr.length; ++i) {
    newL.push(arr[i]!.elm);
  }
  return newL;
}

/**
 * Splits a Vector at the given index and return the two sides in a pair.
 * The left side will contain all elements before but not including the
 * element at the given index. The right side contains the element at the
 * index and all elements after it.
 *
 * @complexity `O(log(n))`
 *
 * @tsplus fluent fncts.Vector splitAt
 */
export function splitAt_<A>(as: Vector<A>, index: number): [Vector<A>, Vector<A>] {
  return [as.slice(0, index), as.slice(index, as.length)];
}

/**
 * Splits a Vector at the first element in the Vector for which the given
 * predicate returns `true`.
 *
 * @complexity `O(n)`
 *
 * @tsplus fluent fncts.Vector splitWhen
 */
export function splitWhen_<A>(as: Vector<A>, predicate: Predicate<A>): [Vector<A>, Vector<A>] {
  const idx = as.findIndex(predicate);
  return idx === -1 ? [as, Vector.empty()] : as.splitAt(idx);
}

/**
 * Returns a new Vector with the first element removed. If the Vector is
 * empty the empty Vector is returned.
 *
 * @complexity `O(1)`
 *
 * @tsplus getter fncts.Vector tail
 */
export function tail<A>(as: Vector<A>): Vector<A> {
  return as.slice(1, as.length);
}

/**
 * Takes the first `n` elements from a Vector and returns them in a new Vector.
 *
 * @complexity `O(log(n))`
 * @tsplus fluent fncts.Vector take
 */
export function take_<A>(as: Vector<A>, n: number): Vector<A> {
  return as.slice(0, n);
}

/**
 * Takes the first elements in the Vector for which the predicate returns
 * `true`.
 *
 * @complexity `O(k + log(n))` where `k` is the number of elements satisfying
 * the predicate.
 *
 * @tsplus fluent fncts.Vector takeWhile
 */
export function takeWhile_<A>(as: Vector<A>, predicate: Predicate<A>): Vector<A> {
  const { index } = foldLeftCb(findNotIndexCb, { predicate, index: 0 }, as);
  return as.slice(0, index);
}

/**
 * Takes the last `n` elements from a Vector and returns them in a new
 * Vector.
 *
 * @complexity `O(log(n))`
 * @tsplus fluent fncts.Vector takeLast
 */
export function takeLast_<A>(as: Vector<A>, n: number): Vector<A> {
  return as.slice(as.length - n, as.length);
}

/**
 * Takes the last elements in the Vector for which the predicate returns
 * `true`.
 *
 * @complexity `O(k + log(n))` where `k` is the number of elements
 * satisfying the predicate.
 *
 * @tsplus fluent fncts.Vector takeLastWhile
 */
export function takeLastWhile_<A>(as: Vector<A>, predicate: Predicate<A>): Vector<A> {
  const { index } = foldRightCb(findNotIndexCb, { predicate, index: 0 }, as);
  return as.slice(as.length - index, as.length);
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
 * Returns a new Vector without repeated elements by using the given
 * Eq instance to determine when elements are equal
 *
 * @complexity `O(n)`
 * @tsplus getter fncts.Vector uniq
 */
export function uniq<A>(as: Vector<A>) {
  return (E: Eq<A>) => as.dropRepeatsWith(E.equals_);
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
 * @tsplus fluent fncts.Vector unsafeFind
 */
export function unsafeFind_<A>(as: Vector<A>, predicate: Predicate<A>): A | undefined {
  return foldLeftCb<A, PredState>(findCb, { predicate, result: undefined }, as).result;
}

/**
 * Returns the _last_ element for which the predicate returns `true`.
 * If no such element is found the function returns `undefined`.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.Vector unsafeFindLast
 */
export function unsafeFindLast_<A>(as: Vector<A>, predicate: Predicate<A>): A | undefined {
  return foldRightCb<A, PredState>(findCb, { predicate, result: undefined }, as).result;
}

/**
 * Gets the nth element of the Vector. If `n` is out of bounds
 * `undefined` is returned.
 *
 * @complexity O(log(n))
 * @tsplus fluent fncts.Vector unsafeGet
 */
export function unsafeGet_<A>(l: Vector<A>, index: number): A | undefined {
  if (index < 0 || l.length <= index) {
    return undefined;
  }
  const prefixSize = getPrefixSize(l);
  const suffixSize = getSuffixSize(l);
  if (index < prefixSize) {
    return l.prefix[prefixSize - index - 1];
  } else if (index >= l.length - suffixSize) {
    return l.suffix[index - (l.length - suffixSize)];
  }
  const { offset } = l;
  const depth      = getDepth(l);
  return l.root!.sizes === undefined
    ? nodeNthDense(l.root!, depth, offset === 0 ? index - prefixSize : handleOffset(depth, offset, index - prefixSize))
    : nodeNth(l.root!, depth, offset, index - prefixSize);
}

/**
 * Returns the first element of the Vector. If the Vector is empty the
 * function returns undefined.
 *
 * @complexity O(1)
 * @tsplus getter fncts.Vector unsafeHead
 */
export function unsafeHead<A>(l: Vector<A>): A | undefined {
  const prefixSize = getPrefixSize(l);
  return prefixSize !== 0 ? l.prefix[prefixSize - 1] : l.length !== 0 ? l.suffix[0] : undefined;
}

/**
 * Returns the last element of the Vector. If the Vector is empty the
 * function returns `undefined`.
 *
 * @complexity O(1)
 * @tsplus getter fncts.Vector unsafeLast
 */
export function unsafeLast<A>(l: Vector<A>): A | undefined {
  const suffixSize = getSuffixSize(l);
  return suffixSize !== 0 ? l.suffix[suffixSize - 1] : l.length !== 0 ? l.prefix[0] : undefined;
}

/**
 * Returns a Vector that has the entry specified by the index replaced with the given value.
 *
 * If the index is out of bounds the given Vector is returned unchanged.
 *
 * @complexity O(log(n))
 * @tsplus fluent fncts.Vector updateAt
 */
export function updateAt_<A>(as: Vector<A>, i: number, a: A): Vector<A> {
  if (i < 0 || as.length <= i) {
    return as;
  }
  const prefixSize = getPrefixSize(as);
  const suffixSize = getSuffixSize(as);
  const newVector  = mutableClone(as);
  if (i < prefixSize) {
    const newPrefix                     = copyArray(newVector.prefix);
    newPrefix[newPrefix.length - i - 1] = a;
    newVector.prefix                    = newPrefix;
  } else if (i >= as.length - suffixSize) {
    const newSuffix = copyArray(newVector.suffix);
    newSuffix[i - (as.length - suffixSize)] = a;
    newVector.suffix = newSuffix;
  } else {
    newVector.root = updateNode(as.root!, getDepth(as), i - prefixSize, as.offset, a);
  }
  return newVector;
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
