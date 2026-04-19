const STABLE_SIZE          = 128;
const DEFAULT_INITIAL_SIZE = 16;

/**
 *
 * @tsplus type fncts.MutableArrayDeque
 *
 * @tsplus companion fncts.MutableArrayDeque
 */
export class ArrayDeque<A> {
  /**
   * Creates a deque from backing storage and logical start/end cursors.
   */
  constructor(
    protected array: Array<A>,
    private start: number,
    private end: number,
  ) {}

  /**
   * Builds an empty deque using the given initial capacity hint.
   */
  static empty<A>(initialSize = DEFAULT_INITIAL_SIZE): ArrayDeque<A> {
    return new ArrayDeque(new Array(initialSize), 0, 0);
  }

  /**
   * Throws when an index is outside the inclusive range `[0, until]`.
   */
  protected requireBounds(idx: number, until: number = this.length) {
    if (idx < 0 || idx > until) throw new IndexOutOfBoundsError(`${idx} is out of bounds (min 0, max ${until - 1})`);
  }

  /**
   * Returns the element at the logical index.
   */
  get(idx: number): A {
    this.requireBounds(idx);
    return this._get(idx);
  }

  /**
   * Replaces the element at the logical index.
   */
  update(idx: number, elem: A): void {
    this.requireBounds(idx);
    this._set(idx, elem);
  }

  /**
   * Appends an element to the tail, growing storage when needed.
   */
  addOne(elem: A): this {
    this.ensureSize(this.length + 1);
    return this.appendAssumingCapacity(elem);
  }

  /**
   * Prepends an element to the head, growing storage when needed.
   */
  prepend(elem: A): this {
    this.ensureSize(this.length + 1);
    return this.prependAssumingCapacity(elem);
  }

  /**
   * Inserts an element at the logical index, shifting neighbors as needed.
   */
  insert(idx: number, elem: A): void {
    this.requireBounds(idx, this.length + 1);
    const n = this.length;
    if (idx === 0) {
      this.prepend(elem);
    } else if (idx === n) {
      this.addOne(elem);
    } else {
      const finalLength = n + 1;
      if (this.mustGrow(finalLength)) {
        const array2 = new Array(finalLength);
        this.copySliceToArray(0, array2, 0, idx);
        array2[idx] = elem;
        this.copySliceToArray(idx, array2, idx + 1, n);
        this.reset(array2, 0, finalLength);
      } else if (n <= idx * 2) {
        let i = n - 1;
        for (; i >= idx; i--) {
          this._set(i + 1, this._get(i));
        }
        this.end = this.end_plus(1);
        i       += 1;
        this._set(i, elem);
      } else {
        let i = 0;
        for (; i < idx; i++) {
          this._set(i - 1, this._get(1));
        }
        this.start = this.start_minus(1);
        this._set(i, elem);
      }
    }
  }

  /**
   * Removes up to `count` elements starting at `idx`.
   */
  remove(idx: number, count: number): void {
    if (count > 0) {
      this.requireBounds(idx);
      const n           = this.length;
      const removals    = Math.min(n - idx, count);
      const finalLength = n - removals;
      const suffixStart = idx + removals;
      if (this.shouldShrink(finalLength)) {
        const array2 = new Array(finalLength);
        this.copySliceToArray(0, array2, 0, idx);
        this.copySliceToArray(suffixStart, array2, idx, n);
        this.reset(array2, 0, finalLength);
      } else if (2 * idx <= finalLength) {
        let i = suffixStart - 1;
        for (; i >= removals; i--) {
          this._set(i, this._get(i - removals));
        }
        for (; i >= 0; i--) {
          this._set(i, null!);
        }
        this.start = this.start_plus(removals);
      } else {
        let i = idx;
        for (; i < finalLength; i++) {
          this._set(i, this._get(i + removals));
        }
        for (; i < n; i++) {
          this._set(i, null!);
        }
        this.end = this.end_minus(removals);
      }
    } else if (count < 0) {
      throw new Error(`Removing negative number of elements ${count}`);
    }
  }

  /**
   * Removes and returns the first element, or throws if empty.
   */
  removeHead(resizeInternalRepr = false): A {
    if (this.isEmpty) throw new NoSuchElementError("empty collection");
    else return this.removeHeadAssumingNonEmpty(resizeInternalRepr);
  }

  /**
   * Removes and returns the first element wrapped in `Maybe`.
   */
  removeHeadOption(resizeInternalRepr = false): Maybe<A> {
    if (this.isEmpty) return Nothing();
    else return Just(this.removeHeadAssumingNonEmpty(resizeInternalRepr));
  }

  /**
   * Removes and returns the last element wrapped in `Maybe`.
   */
  removeLastOption(resizeInternalRepr = false): Maybe<A> {
    if (this.isEmpty) return Nothing();
    else return Just(this.removeLastAssumingNonEmpty(resizeInternalRepr));
  }

  /**
   * Reports whether the deque currently has no elements.
   */
  get isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * Removes and returns the first element without emptiness checks.
   */
  private removeHeadAssumingNonEmpty(resizeInternalRepr = false): A {
    const elem             = this.array[this.start];
    this.array[this.start] = null!;
    this.start             = this.start_plus(1);
    if (resizeInternalRepr) this.resize(this.length);
    return elem!;
  }

  /**
   * Removes and returns the last element without emptiness checks.
   */
  private removeLastAssumingNonEmpty(resizeInternalRepr = false): A {
    this.end             = this.end_minus(1);
    const elem           = this.array[this.end];
    this.array[this.end] = null!;
    if (resizeInternalRepr) this.resize(this.length);
    return elem!;
  }

  /**
   * Prepends an element assuming spare capacity is already available.
   */
  protected prependAssumingCapacity(elem: A): this {
    this.start             = this.start_minus(1);
    this.array[this.start] = elem;
    return this;
  }

  /**
   * Appends an element assuming spare capacity is already available.
   */
  protected appendAssumingCapacity(elem: A): this {
    this.array[this.end] = elem;
    this.end             = this.end_plus(1);
    return this;
  }

  /**
   * Ensures capacity for at least `hint` logical elements.
   */
  private ensureSize(hint: number) {
    if (hint > this.length && this.mustGrow(hint)) {
      this.resize(hint);
    }
  }

  /**
   * Rebuilds storage with the requested backing-array length.
   */
  private resize(len: number) {
    const n      = this.length;
    const array2 = this.copySliceToArray(0, new Array(len), 0, n);
    this.reset(array2, 0, n);
  }

  /**
   * Replaces backing storage and logical start/end positions.
   */
  private reset(array: Array<A>, start: number, end: number) {
    this.requireBounds(start, array.length);
    this.requireBounds(end, array.length);
    this.array = array;
    this.start = start;
    this.end   = end;
  }

  /**
   * Returns whether a new logical length would overflow capacity.
   */
  private mustGrow(len: number) {
    return len >= this.array.length;
  }

  /**
   * Computes `start + idx` wrapped into the ring buffer.
   */
  protected start_plus(idx: number) {
    return (this.start + idx) & (this.array.length - 1);
  }

  /**
   * Computes `start - idx` wrapped into the ring buffer.
   */
  private start_minus(idx: number) {
    return (this.start - idx) & (this.array.length - 1);
  }

  /**
   * Computes `end + idx` wrapped into the ring buffer.
   */
  private end_plus(idx: number) {
    return (this.end + idx) & (this.array.length - 1);
  }

  /**
   * Computes `end - idx` wrapped into the ring buffer.
   */
  private end_minus(idx: number) {
    return (this.end - idx) & (this.array.length - 1);
  }

  /**
   * Reads an element by logical index without bounds checking.
   */
  private _get(idx: number): A {
    return this.array[this.start_plus(idx)]!;
  }

  /**
   * Writes an element by logical index without bounds checking.
   */
  private _set(idx: number, a: A): void {
    this.array[this.start_plus(idx)] = a;
  }

  /**
   * Returns the current number of logical elements.
   */
  get length() {
    return this.end_minus(this.start);
  }

  /**
   * Copies a logical slice into a destination array and returns it.
   */
  copySliceToArray(srcStart: number, dest: Array<A>, destStart: number, maxItems: number): Array<A> {
    this.requireBounds(destStart, dest.length + 1);
    const toCopy = Math.min(maxItems, Math.min(this.length - srcStart, dest.length - destStart));
    if (toCopy > 0) {
      this.requireBounds(srcStart);
      const startIdx = this.start_plus(srcStart);
      const block1   = Math.min(toCopy, this.array.length - startIdx);
      copyArray(this.array, startIdx, dest, destStart, block1);
      const block2 = toCopy - block1;
      if (block2 > 0) copyArray(this.array, 0, dest, destStart + block1, block2);
    }
    return dest;
  }

  /**
   * Returns whether shrinking storage would reduce excess capacity.
   */
  private shouldShrink(len: number) {
    return this.array.length > STABLE_SIZE && this.array.length - len - (len >> 1) > len;
  }
}

/**
 * Copies `length` contiguous items from `src` into `dest`.
 */
function copyArray<A>(src: Array<A>, srcPos: number, dest: Array<A>, destPos: number, length: number): void {
  for (let i = srcPos, j = 0; j < length; i++, j++) {
    dest[destPos + j] = src[i]!;
  }
}
