export class HashedPair<A, B> implements Hashable, Equatable {
  constructor(
    readonly first: A,
    readonly second: B,
  ) {}

  get [Symbol.hash]() {
    return Hashable.combine(Hashable.unknown(this.first), Hashable.unknown(this.second));
  }

  [Symbol.equals](that: unknown) {
    return (
      that instanceof HashedPair &&
      Equatable.strictEquals(this.first, that.first) &&
      Equatable.strictEquals(this.second, that.second)
    );
  }
}
