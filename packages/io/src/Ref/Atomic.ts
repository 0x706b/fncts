import { RefInternal } from "./definition.js";

/**
 * @tsplus type fncts.io.Ref.Atomic
 */
export class Atomic<A> extends RefInternal<A> {
  readonly _tag = "Atomic";

  constructor(private value: A) {
    super();
  }

  get unsafeGet(): A {
    return this.value;
  }

  unsafeSet(a: A): void {
    this.value = a;
  }

  get: UIO<A> = IO.succeed(this.value);

  set(a: A): UIO<void> {
    return IO.succeed(() => {
      this.value = a;
    });
  }

  modify<B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
    return IO.succeed(() => {
      const v = this.unsafeGet;
      const o = f(v);
      this.unsafeSet(o[1]);
      return o[0];
    });
  }
}
