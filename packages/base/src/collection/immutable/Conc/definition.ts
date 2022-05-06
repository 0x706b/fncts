import { Iterable } from "../../Iterable/definition.js";

export interface ConcF extends HKT {
  readonly type: Conc<this["A"]>;
  readonly index: number;
}

export const BUFFER_SIZE = 64;

export const UPDATE_BUFFER_SIZE = 256;

export const ConcTypeId = Symbol.for("fncts.Conc");
export type ConcTypeId = typeof ConcTypeId;

export const enum ConcTag {
  Empty = "Empty",
  Concat = "Concat",
  AppendN = "AppendN",
  PrependN = "PrependN",
  Update = "Update",
  Slice = "Slice",
  Singleton = "Singleton",
  Chunk = "Chunk",
  ByteChunk = "ByteChunk",
}

/**
 * @tsplus type fncts.Conc
 * @tsplus companion fncts.ConcOps
 */
export abstract class Conc<A> implements Iterable<A>, Hashable, Equatable {
  readonly _typeId: ConcTypeId = ConcTypeId;
  readonly _A!: () => A;
  abstract readonly length: number;
  abstract [Symbol.iterator](): Iterator<A>;

  get [Symbol.hash](): number {
    return Hashable.iterator(this[Symbol.iterator]());
  }

  [Symbol.equals](that: unknown): boolean {
    return Conc.isConc(that) && (this as Conc<A>).corresponds(that, Equatable.strictEquals);
  }
}

abstract class ConcImplementation<A> extends Conc<A> {
  abstract readonly length: number;
  abstract readonly binary: boolean;
  abstract get(n: number): A;
  abstract copyToArray(n: number, dest: Array<A> | Uint8Array): void;
  abstract readonly left: ConcImplementation<A>;
  abstract readonly right: ConcImplementation<A>;

  readonly depth: number = 0;

  arrayIterator(): Iterator<ArrayLike<A>> {
    return this.materialize().arrayIterator();
  }

  reverseArrayIterator(): Iterator<ArrayLike<A>> {
    return this.materialize().reverseArrayIterator();
  }

  [Symbol.iterator](): Iterator<A> {
    return this.materialize()[Symbol.iterator]();
  }

  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    this.materialize().forEach(startIndex, f);
  }

  private arrayLikeCache: ArrayLike<unknown> | undefined;

  arrayLike(): ArrayLike<A> {
    if (this.arrayLikeCache) {
      return this.arrayLikeCache as ArrayLike<A>;
    }
    const arr = this.binary ? alloc(this.length) : Array<A>(this.length);
    this.copyToArray(0, arr);
    this.arrayLikeCache = arr;
    return arr as ArrayLike<A>;
  }

  private arrayCache: Array<unknown> | undefined;

  array(): ReadonlyArray<A> {
    if (this.arrayCache) {
      return this.arrayCache as Array<A>;
    }
    const arr = Array<A>(this.length);
    this.copyToArray(0, arr);
    this.arrayCache = arr;
    return arr as Array<A>;
  }

  concat<B>(that: ConcImplementation<B>): ConcImplementation<A | B> {
    concrete<A>(this);
    concrete<B>(that);
    if (this._tag === ConcTag.Empty) {
      return that;
    }
    if (that._tag === ConcTag.Empty) {
      return this;
    }
    if (this._tag === ConcTag.AppendN) {
      const conc = fromArray(this.buffer as Array<A>).take(this.bufferUsed);
      return this.start.concat(conc).concat(that);
    }
    if (that._tag === ConcTag.PrependN) {
      const conc = fromArray(that.bufferUsed === 0 ? [] : (that.buffer as B[]).slice(-that.bufferUsed));
      return this.concat(conc).concat(that.end);
    }
    const diff = that.depth - this.depth;
    if (Math.abs(diff) <= 1) {
      return new Concat(this, that);
    } else if (diff < -1) {
      if (this.left.depth >= this.right.depth) {
        const nr = this.right.concat(that);
        return new Concat(this.left, nr);
      } else {
        concrete(this.right);
        const nrr = this.right.right.concat(that);
        if (nrr.depth === this.depth - 3) {
          const nr = new Concat(this.right.left, nrr);
          return new Concat(this.left, nr);
        } else {
          const nl = new Concat(this.left, this.right.left);
          return new Concat(nl, nrr);
        }
      }
    } else {
      if (that.right.depth >= that.left.depth) {
        const nl = this.concat(that.left);
        return new Concat(nl, that.right);
      } else {
        concrete(that.left);
        const nll = this.concat(that.left.left);
        if (nll.depth === that.depth - 3) {
          const nl = new Concat(nll, that.left.right);
          return new Concat(nl, that.right);
        } else {
          const nr = new Concat(that.left.right, that.right);
          return new Concat(nll, nr);
        }
      }
    }
  }
  take(n: number): ConcImplementation<A> {
    if (n <= 0) {
      return _Empty;
    } else if (n >= this.length) {
      return this;
    } else {
      concrete<A>(this);
      switch (this._tag) {
        case ConcTag.Empty:
          return _Empty;
        case ConcTag.Slice:
          return n >= this.l ? this : new Slice(this.conc, this.offset, n);
        case ConcTag.Singleton:
          return this;
        default:
          return new Slice(this, 0, n);
      }
    }
  }
  append<A1>(a: A1): ConcImplementation<A | A1> {
    const binary = this.binary && isByte(a);
    const buffer = this.binary && binary ? alloc(BUFFER_SIZE) : Array<A | A1>(BUFFER_SIZE);
    buffer[0]    = a;
    return new AppendN<A | A1>(this as ConcImplementation<A | A1>, buffer, 1, this.binary && binary);
  }
  prepend<A1>(a: A1): ConcImplementation<A | A1> {
    const binary            = this.binary && isByte(a);
    const buffer            = this.binary && binary ? alloc(BUFFER_SIZE) : Array<A | A1>(BUFFER_SIZE);
    buffer[BUFFER_SIZE - 1] = a;
    return new PrependN<A | A1>(this as ConcImplementation<A | A1>, buffer, 1, this.binary && binary);
  }

  update<A1>(index: number, a1: A1): ConcImplementation<A | A1> {
    if (index < 0 || index >= this.length) {
      throw new IndexOutOfBoundsError(`Conc.update access to ${index}`);
    }
    const binary        = this.binary && isByte(a1);
    const bufferIndices = Array<number>(UPDATE_BUFFER_SIZE);
    const bufferValues  = binary ? alloc(UPDATE_BUFFER_SIZE) : Array<any>(UPDATE_BUFFER_SIZE);
    bufferIndices[0]    = index;
    bufferValues[0]     = a1;
    return new Update(this, bufferIndices, bufferValues, 1, binary);
  }

  /**
   * Materializes a Conc into a Conc backed by an array. This method can
   * improve the performance of bulk operations.
   */
  materialize(): ConcImplementation<A> {
    concrete(this);
    switch (this._tag) {
      case ConcTag.Empty:
        return this;
      case ConcTag.Chunk:
        return this;
      default:
        return fromArray(this.arrayLike());
    }
  }
}

const alloc = typeof Buffer !== "undefined" ? Buffer.alloc : (n: number) => new Uint8Array(n);

export class Empty<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.Empty;

  length = 0;
  depth  = 0;
  left   = this;
  right  = this;
  binary = false;
  get(index: number): A {
    throw new ArrayIndexOutOfBoundsError(`Conc.get access to ${index}`);
  }
  forEach<B>(_: number, __: (i: number, a: never) => B): void {
    return;
  }
  copyToArray(_: number, __: Array<A> | Uint8Array): void {
    return;
  }
  [Symbol.iterator](): Iterator<A> {
    return {
      next: () => {
        return {
          value: null,
          done: true,
        };
      },
    };
  }
  arrayIterator(): Iterator<Array<A>> {
    return {
      next: () => ({
        value: undefined,
        done: true,
      }),
    };
  }
  reverseArrayIterator(): Iterator<Array<A>> {
    return {
      next: () => ({
        value: undefined,
        done: true,
      }),
    };
  }
}

export const _Empty = new Empty<any>();

export class Concat<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.Concat;

  length = this.left.length + this.right.length;
  depth  = 1 + Math.max(this.left.depth, this.right.depth);
  binary = this.left.binary && this.right.binary;
  constructor(readonly left: ConcImplementation<A>, readonly right: ConcImplementation<A>) {
    super();
  }
  get(n: number): A {
    return n < this.left.length ? this.left.get(n) : this.right.get(n - this.left.length);
  }
  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    this.left.forEach(startIndex, f);
    this.right.forEach(startIndex + this.left.length, f);
  }
  copyToArray(n: number, dest: Array<A> | Uint8Array): void {
    this.left.copyToArray(n, dest);
    this.right.copyToArray(n + this.left.length, dest);
  }
  [Symbol.iterator](): Iterator<A> {
    return this.left.asIterable.concat(this.right)[Symbol.iterator]();
  }
  arrayIterator(): Iterator<ArrayLike<A>> {
    return Iterable.make(() => this.left.arrayIterator())
      .concat(Iterable.make(() => this.right.arrayIterator()))
      [Symbol.iterator]();
  }
  reverseArrayIterator(): Iterator<ArrayLike<A>> {
    return Iterable.make(() => this.right.reverseArrayIterator())
      .concat(Iterable.make(() => this.left.reverseArrayIterator()))
      [Symbol.iterator]();
  }
}

class AppendN<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.AppendN;

  length: number;
  depth = 0;
  left  = _Empty;
  right = _Empty;

  constructor(
    readonly start: ConcImplementation<A>,
    readonly buffer: Array<unknown> | Uint8Array,
    readonly bufferUsed: number,
    readonly binary: boolean,
  ) {
    super();
    this.length = this.start.length + this.bufferUsed;
  }

  [Symbol.iterator](): Iterator<A> {
    return this.start.asIterable.concat(this.buffer.asIterable.take(this.bufferUsed))[Symbol.iterator]() as Iterator<A>;
  }

  append<A1>(a: A1): ConcImplementation<A | A1> {
    const binary = this.binary && isByte(a);
    if (this.bufferUsed < this.buffer.length) {
      if (this.binary && !binary) {
        const buffer = Array(BUFFER_SIZE);
        for (let i = 0; i < BUFFER_SIZE; i++) {
          buffer[i] = this.buffer[i];
        }
        buffer[this.bufferUsed] = a;
        return new AppendN<A | A1>(
          this.start as ConcImplementation<A | A1>,
          this.buffer,
          this.bufferUsed + 1,
          this.binary && binary,
        );
      }
      this.buffer[this.bufferUsed] = a;
      return new AppendN<A | A1>(
        this.start as ConcImplementation<A | A1>,
        this.buffer,
        this.bufferUsed + 1,
        this.binary && binary,
      );
    } else {
      const buffer = this.binary && binary ? alloc(BUFFER_SIZE) : Array(BUFFER_SIZE);
      buffer[0]    = a;
      const conc   = fromArray(this.buffer as Array<A>).take(this.bufferUsed);
      return new AppendN<A | A1>(
        this.start.concat(conc) as ConcImplementation<A | A1>,
        buffer,
        1,
        this.binary && binary,
      );
    }
  }

  get(n: number): A {
    if (n < this.start.length) {
      return this.start.get(n);
    } else {
      return this.buffer[n - this.start.length] as A;
    }
  }

  copyToArray(n: number, dest: Array<A> | Uint8Array): void {
    this.start.copyToArray(n, dest);
    copyArray(this.buffer as ArrayLike<A>, 0, dest, this.start.length + n, this.bufferUsed);
  }

  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    this.start.forEach(startIndex, f);
    for (let i = 0; i < this.bufferUsed; i++) {
      f(startIndex + this.start.length + i, this.buffer[i] as A);
    }
  }
}

class PrependN<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.PrependN;

  length: number;
  left  = _Empty;
  right = _Empty;

  constructor(
    readonly end: ConcImplementation<A>,
    readonly buffer: Array<unknown> | Uint8Array,
    readonly bufferUsed: number,
    readonly binary: boolean,
  ) {
    super();
    this.length = this.end.length + this.bufferUsed;
  }

  [Symbol.iterator](): Iterator<A> {
    return this.buffer.asIterable.take(this.bufferUsed).concat(this.end)[Symbol.iterator]() as Iterator<A>;
  }

  prepend<A1>(a: A1): ConcImplementation<A | A1> {
    const binary = this.binary && isByte(a);
    if (this.bufferUsed < this.buffer.length) {
      if (this.binary && !binary) {
        const buffer = Array(BUFFER_SIZE);
        for (let i = 0; i < BUFFER_SIZE; i++) {
          buffer[i] = this.buffer[i];
        }
        buffer[BUFFER_SIZE - this.bufferUsed - 1] = a;
        return new PrependN<A | A1>(
          this.end as ConcImplementation<A | A1>,
          buffer,
          this.bufferUsed + 1,
          this.binary && binary,
        );
      }
      this.buffer[BUFFER_SIZE - this.bufferUsed - 1] = a;
      return new PrependN<A | A1>(
        this.end as ConcImplementation<A | A1>,
        this.buffer,
        this.bufferUsed + 1,
        this.binary && binary,
      );
    } else {
      const buffer            = this.binary && binary ? alloc(BUFFER_SIZE) : Array(BUFFER_SIZE);
      buffer[BUFFER_SIZE - 1] = a;
      const conc              = fromArray(
        "subarray" in this.buffer
          ? this.buffer.subarray(this.buffer.length - this.bufferUsed)
          : this.buffer.slice(this.buffer.length - this.bufferUsed),
      ) as ConcImplementation<A>;
      return new PrependN<A | A1>(
        conc.concat(this.end) as ConcImplementation<A | A1>,
        buffer,
        1,
        this.binary && binary,
      );
    }
  }

  get(n: number): A {
    return n < this.bufferUsed
      ? (this.buffer[BUFFER_SIZE - this.bufferUsed + n] as A)
      : this.end.get(n - this.bufferUsed);
  }

  copyToArray(n: number, dest: Array<A> | Uint8Array) {
    const length = Math.min(this.bufferUsed, Math.max(dest.length - n, 0));
    copyArray(this.buffer, BUFFER_SIZE - this.bufferUsed, dest, n, length);
    this.end.copyToArray(n + length, dest);
  }

  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    for (let i = BUFFER_SIZE - this.bufferUsed, j = 0; i < BUFFER_SIZE; i++, j++) {
      f(startIndex + j, this.buffer[i] as A);
    }
    this.end.forEach(startIndex + this.bufferUsed, f);
  }
}

class Update<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.Update;

  length: number;
  left  = _Empty;
  right = _Empty;

  constructor(
    readonly conc: ConcImplementation<A>,
    readonly bufferIndices: Array<number>,
    readonly bufferValues: Array<any> | Uint8Array,
    readonly used: number,
    readonly binary: boolean,
  ) {
    super();
    this.length = this.conc.length;
  }

  get(n: number): A {
    let a: A = null!;
    for (let j = this.used; j >= 0; j--) {
      if (this.bufferIndices[j] === n) {
        a = this.bufferValues[j];
        break;
      }
    }
    return a !== null ? a : this.conc.get(n);
  }

  update<A1>(i: number, a: A1): ConcImplementation<A | A1> {
    if (i < 0 || i >= this.length) {
      throw new IndexOutOfBoundsError(`Conc.update access to ${i}`);
    }
    const binary = this.binary && isByte(a);
    if (this.used < UPDATE_BUFFER_SIZE) {
      if (this.binary && !binary) {
        const buffer = Array(UPDATE_BUFFER_SIZE);
        for (let j = 0; j < UPDATE_BUFFER_SIZE; j++) {
          buffer[j] = this.bufferValues[j];
        }
        this.bufferIndices[this.used] = i;
        buffer[this.used]             = a;
        return new Update(this.conc, this.bufferIndices, buffer, this.used + 1, this.binary && binary);
      }
      this.bufferIndices[this.used] = i;
      this.bufferValues[this.used]  = a;
      return new Update(this.conc, this.bufferIndices, this.bufferValues, this.used + 1, this.binary && binary);
    } else {
      const bufferIndices = Array<number>(UPDATE_BUFFER_SIZE);
      const bufferValues  = this.binary && binary ? alloc(UPDATE_BUFFER_SIZE) : Array<any>(UPDATE_BUFFER_SIZE);
      bufferIndices[0]    = i;
      bufferValues[0]     = a;
      const array         = toArray(this.conc);
      return new Update(fromArray(array), bufferIndices, bufferValues, 1, this.binary && binary);
    }
  }

  copyToArray(n: number, dest: Array<A>): void {
    this.conc.copyToArray(n, dest);
    for (let i = 0; i < this.used; i++) {
      const index = this.bufferIndices[i]!;
      const value = this.bufferValues[i]!;
      dest[index] = value;
    }
  }
}

export class Singleton<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.Singleton;

  length = 1;
  depth  = 0;
  left   = _Empty;
  right  = _Empty;
  binary: boolean;

  constructor(readonly value: A) {
    super();
    this.binary = isByte(this.value);
  }

  get(n: number): A {
    if (n === 0) {
      return this.value;
    }
    throw new ArrayIndexOutOfBoundsError(`Chunk.get access to ${n}`);
  }

  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    f(startIndex, this.value);
  }

  copyToArray(n: number, dest: Array<A> | Uint8Array) {
    dest[n] = this.value;
  }

  [Symbol.iterator]() {
    return Iterable.single(this.value)[Symbol.iterator]();
  }

  arrayIterator() {
    return Iterable.single([this.value])[Symbol.iterator]();
  }

  reverseArrayIterator = this.arrayIterator;
}

export class Slice<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.Slice;

  length: number;
  binary: boolean;
  depth = 0;
  left  = _Empty;
  right = _Empty;

  constructor(readonly conc: ConcImplementation<A>, readonly offset: number, readonly l: number) {
    super();
    this.binary = this.conc.binary;
    this.length = this.l;
  }

  get(n: number): A {
    return this.conc.get(this.offset + n);
  }

  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    let i = 0;
    while (i < this.length) {
      f(startIndex + i, this.get(i));
      i++;
    }
  }

  copyToArray(n: number, dest: Array<A> | Uint8Array) {
    let i = 0;
    let j = n;
    while (i < this.length) {
      dest[j] = this.get(i);
      i++;
      j++;
    }
  }
}

export class Chunk<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.Chunk;

  length: number;
  depth  = 0;
  left   = _Empty;
  right  = _Empty;
  binary = false;

  constructor(readonly _array: ReadonlyArray<A>) {
    super();
    this.length = this._array.length;
  }

  get(n: number): A {
    if (n >= this.length || n < 0) {
      throw new ArrayIndexOutOfBoundsError(`Conc.get access to ${n}`);
    }
    return this._array[n]!;
  }

  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    for (let i = 0; i < this.length; i++) {
      f(startIndex + i, this._array[i]!);
    }
  }

  copyToArray(n: number, dest: Array<A> | Uint8Array): void {
    copyArray(this._array, 0, dest, n, this.length);
  }

  [Symbol.iterator](): Iterator<A> {
    return this._array[Symbol.iterator]();
  }

  arrayIterator() {
    return Iterable.single(this._array)[Symbol.iterator]();
  }

  reverseArrayIterator = this.arrayIterator;
}

export class ByteChunk<A> extends ConcImplementation<A> {
  readonly _tag = ConcTag.ByteChunk;

  length: number;
  depth  = 0;
  left   = _Empty;
  right  = _Empty;
  binary = true;

  constructor(readonly _array: Uint8Array) {
    super();
    this.length = this._array.length;
  }

  get(n: number): A {
    if (n >= this.length || n < 0) {
      throw new ArrayIndexOutOfBoundsError(`Conc.get access to ${n}`);
    }
    return unsafeCoerce(this._array[n]);
  }

  forEach<B>(startIndex: number, f: (i: number, a: A) => B): void {
    for (let i = 0; i < this.length; i++) {
      f(startIndex + i, unsafeCoerce(this._array[i]));
    }
  }

  [Symbol.iterator](): Iterator<A> {
    return unsafeCoerce(this._array[Symbol.iterator]());
  }

  copyToArray(n: number, dest: Array<A> | Uint8Array): void {
    copyArray(this._array, 0, unsafeCoerce(dest), n, this.length);
  }

  arrayIterator(): Iterator<Array<A>> {
    return unsafeCoerce(Iterable.single(this._array)[Symbol.iterator]());
  }

  reverseArrayIterator(): Iterator<Array<A>> {
    return unsafeCoerce(this.arrayIterator());
  }
}

/**
 * @tsplus macro remove
 */
export function concrete<A>(
  _: Conc<A>,
): asserts _ is Empty<A> | Singleton<A> | Concat<A> | AppendN<A> | PrependN<A> | Slice<A> | Chunk<A> | ByteChunk<A> {
  //
}

function copyArray<A>(
  source: ArrayLike<A>,
  sourcePos: number,
  dest: Array<A> | Uint8Array,
  destPos: number,
  length: number,
): void {
  const j = Math.min(source.length, sourcePos + length);
  for (let i = sourcePos; i < j; i++) {
    dest[destPos + i - sourcePos] = source[i]!;
  }
}

/**
 * @tsplus static fncts.ConcOps fromArray
 */
export function fromArray<A>(array: ArrayLike<A>): ConcImplementation<A> {
  if (array.length === 0) {
    return _Empty;
  } else {
    return "buffer" in array ? (new ByteChunk(array as any) as any) : new Chunk(Array.from(array));
  }
}

/**
 * @tsplus static fncts.ConcOps isConc
 */
export function isConc<A>(u: Iterable<A>): u is Conc<A>;
export function isConc(u: unknown): u is Conc<unknown>;
export function isConc(u: unknown): u is Conc<unknown> {
  return isObject(u) && "_typeId" in u && u["_typeId" as keyof typeof u] === ConcTypeId;
}

/**
 * @tsplus fluent fncts.Conc corresponds
 */
export function corresponds_<A, B>(self: Conc<A>, bs: Conc<B>, f: (a: A, b: B) => boolean): boolean {
  if (self.length !== bs.length) {
    return false;
  }

  concrete(self);
  concrete(bs);

  const leftIterator  = self.arrayIterator();
  const rightIterator = bs.arrayIterator();

  let left: ArrayLike<A> | undefined  = undefined;
  let right: ArrayLike<B> | undefined = undefined;
  let leftLength  = 0;
  let rightLength = 0;
  let i           = 0;
  let j           = 0;
  let equal       = true;
  let done        = false;

  let leftNext;
  let rightNext;

  while (equal && !done) {
    if (i < leftLength && j < rightLength) {
      const a = left![i]!;
      const b = right![j]!;
      if (!f(a, b)) {
        equal = false;
      }
      i++;
      j++;
    } else if (i === leftLength && !(leftNext = leftIterator.next()).done) {
      left       = leftNext.value;
      leftLength = left.length;
      i          = 0;
    } else if (j === rightLength && !(rightNext = rightIterator.next()).done) {
      right       = rightNext.value;
      rightLength = right.length;
      j           = 0;
    } else if (i === leftLength && j === rightLength) {
      done = true;
    } else {
      equal = false;
    }
  }

  return equal;
}

/**
 * @tsplus getter fncts.Conc toArray
 */
export function toArray<A>(conc: Conc<A>): ReadonlyArray<A> {
  concrete(conc);
  return conc.array();
}
