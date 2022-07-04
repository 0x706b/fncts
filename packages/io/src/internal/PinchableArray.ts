export class PinchableArray<A> {
  constructor(private hint: number) {}
  private array  = this.hint < 0 ? null! : new Array<A>(this.hint);
  private _pinch = null! as A[];
  private _size  = 0;

  push(a: A): void {
    this.ensureCapacity(1);
    this.array[this._size] = a;
    this._size            += 1;
  }

  pushAll(as: Conc<A>): void {
    this.ensureCapacity(as.length);

    for (let i = 0, j = this._size; i < as.length; i++, j++) {
      this.array[j] = as.unsafeGet(i);
    }

    this._size += as.length;
  }

  ensureCapacity(elements: number): void {
    const newSize = this._size + elements;

    if (this.array === null) {
      this.array = new Array<A>(newSize);
    } else if (newSize > this.array.length) {
      const newStack = new Array<A>(newSize + ((this._size / 2) >> 0));
      arraycopy(this.array, 0, newStack, 0, this._size);
      this.array = newStack;
    }
  }

  pinch(): Conc<A> {
    const size = this._size;

    if (this.array === null || size === 0) return Conc.empty();
    else {
      this.ensurePinchCapacity(size);
      arraycopy(this.array, 0, this._pinch, 0, size);
      this._size = 0;
      return Conc.fromArray(this._pinch).take(size);
    }
  }

  private ensurePinchCapacity(newSize: number): void {
    if (this._pinch === null) {
      this._pinch = new Array<A>(newSize);
    } else if (newSize > this._pinch.length) {
      this._pinch = new Array<A>(newSize);
    }
  }
}

function arraycopy<A>(source: A[], sourceIndex: number, target: A[], targetIndex: number, size: number): void {
  const offset = targetIndex - sourceIndex;
  for (let i = sourceIndex; i < size; i++) {
    target[i - offset] = source[i]!;
  }
}
