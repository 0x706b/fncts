import { Equatable, Hashable } from "../prelude";

export class HashedPair<A, B> implements Hashable, Equatable {
  constructor(readonly first: A, readonly second: B) {}

  get [Symbol.hashable]() {
    return Hashable.combineHash(Hashable.hash(this.first), Hashable.hash(this.second));
  }

  [Symbol.equatable](that: unknown) {
    return that instanceof HashedPair && Equatable.strictEquals(this.first, that.first) && Equatable.strictEquals(this.second, that.second);
  }
}
