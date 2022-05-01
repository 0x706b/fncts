import { isHashable } from "@fncts/base/typeclass/Hashable/definition";
import { PCGRandom } from "@fncts/base/util/PCGRandom";
import { isArray, isDefined, isIterable, isPlain } from "@fncts/base/util/predicates";

const CACHE  = new WeakMap<any, number>();
const RANDOM = new PCGRandom((Math.random() * 4294967296) >>> 0);

let _current = 0;

/**
 * @tsplus static fncts.HashableOps string
 */
export function hashString(str: string) {
  return optimize(_hashString(str));
}

function _hashString(str: string) {
  let h = 5381;
  let i = str.length;
  while (i) h = (h * 33) ^ str.charCodeAt(--i);
  return h;
}

/**
 * @tsplus static fncts.HashableOps number
 */
export function hashNumber(n: number): number {
  return optimize(_hashNumber(n));
}

function _hashNumber(n: number): number {
  if (n !== n || n === Infinity) return 0;
  let h = n | 0;
  if (h !== n) h ^= n * 0xffffffff;
  // eslint-disable-next-line no-param-reassign
  while (n > 0xffffffff) h ^= n /= 0xffffffff;
  return n;
}

/**
 * @tsplus static fncts.HashableOps object
 */
export function hashObject(value: object): number {
  return optimize(_hashObject(value));
}

function _hashObject(value: object): number {
  let h = CACHE.get(value);
  if (isDefined(h)) return h;
  if (isHashable(value)) {
    h = value[Symbol.hash];
  } else if (isArray(value)) {
    h = _hashArray(value);
  } else if (isIterable(value)) {
    h = _hashIterator(value[Symbol.iterator]());
  } else if (isPlain(value)) {
    h = _hashPlainObject(value);
  } else {
    h = _current++;
  }
  CACHE.set(value, h);
  return h;
}

/**
 * @tsplus static fncts.HashableOps plainObject
 */
export function hashPlainObject(o: any) {
  return optimize(_hashPlainObject(o));
}

function _hashPlainObject(o: any): number {
  CACHE.set(o, randomInt());
  const keys = Object.keys(o);
  let h      = 12289;
  for (let i = 0; i < keys.length; i++) {
    h       = _combineHash(h, _hashString(keys[i]!));
    const c = CACHE.get(o[keys[i]!]);
    h       = c ? _combineHash(h, c) : _combineHash(h, _hash((o as any)[keys[i]!]));
  }
  return h;
}

/**
 * @tsplus static fncts.HashableOps miscRef
 */
export function hashMiscRef(o: any) {
  return optimize(_hashMiscRef(o));
}

function _hashMiscRef(o: any): number {
  let h = CACHE.get(o);
  if (isDefined(h)) return h;
  h = randomInt();
  CACHE.set(o, h);
  return h;
}

/**
 * @tsplus static fncts.HashableOps array
 */
export function hashArray(arr: Array<any> | ReadonlyArray<any>): number {
  return optimize(_hashArray(arr));
}

function _hashArray(arr: Array<any> | ReadonlyArray<any>): number {
  let h = 6151;
  for (let i = 0; i < arr.length; i++) {
    h = _combineHash(_hashNumber(i), _hash(arr[i]));
  }
  return h;
}

/**
 * @tsplus static fncts.HashableOps iterator
 */
export function hashIterator(it: Iterator<any>): number {
  return optimize(_hashIterator(it));
}

function _hashIterator(it: Iterator<any>): number {
  let res: IteratorResult<any>;
  let h = 6151;
  while (!(res = it.next()).done) {
    h = _combineHash(h, hashUnknown(res.value));
  }
  return h;
}

/**
 * @tsplus static fncts.HashableOps unknown
 */
export function hashUnknown(value: unknown): number {
  return optimize(_hash(value));
}

function isZero(value: unknown): boolean {
  return value === null || value === void 0 || value === false;
}

function _hash(arg: any): number {
  let x = arg;
  if (isZero(x)) return 0;
  if (typeof x.valueOf === "function" && x.valueOf !== Object.prototype.valueOf) {
    x = x.valueOf();
    if (isZero(x)) return 0;
  }
  switch (typeof x) {
    case "number":
      return _hashNumber(x);
    case "string":
      return _hashString(x);
    case "function":
      return _hashMiscRef(x);
    case "object":
      return _hashObject(x);
    case "boolean":
      return x === true ? 1 : 0;
    case "symbol":
      return _hashUniqueSymbol(x);
    case "bigint":
      return _hashString(x.toString(10));
    case "undefined": {
      return 0;
    }
  }
}

/**
 * @tsplus static fncts.HashableOps combine
 */
export function combineHash(x: number, y: number): number {
  return optimize(_combineHash(x, y));
}

function _combineHash(x: number, y: number): number {
  return (x * 53) ^ y;
}

/**
 * @tsplus static fncts.HashableOps symbol
 */
export function hashUniqueSymbol(sym: symbol): number {
  return optimize(_hashUniqueSymbol(sym));
}

const SYMBOL_CACHE = new Map<symbol, number>();

function _hashUniqueSymbol(sym: symbol): number {
  let h = SYMBOL_CACHE.get(sym);
  if (isDefined(h)) {
    return h;
  }
  h = randomInt();
  SYMBOL_CACHE.set(sym, h);
  return h;
}

/**
 * @tsplus static fncts.HashableOps optimize
 */
export function optimize(n: number): number {
  return (n & 0xbfffffff) | ((n >>> 1) & 0x40000000);
}

function randomInt(): number {
  return RANDOM.integer(0x7fffffff);
}
