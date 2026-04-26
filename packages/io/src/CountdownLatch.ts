export const CountdownLatchTypeId = Symbol.for("fncts.io.CountdownLatch");
export type CountdownLatchTypeId = typeof CountdownLatchTypeId;

/**
 * @tsplus type fncts.io.CountdownLatch
 * @tsplus companion fncts.io.CountdownLatchOps
 */
export class CountdownLatch {
  readonly [CountdownLatchTypeId]: CountdownLatchTypeId = CountdownLatchTypeId;

  constructor(
    private _count: Ref<number>,
    private _waiters: Future<never, void>,
  ) {}

  get await(): UIO<void> {
    return this._waiters.await;
  }

  get countDown(): UIO<void> {
    return this._count.modify((n) => {
      if (n === 0) {
        return [IO.unit, 0];
      } else if (n === 1) {
        return [this._waiters.succeed(undefined), 0];
      } else {
        return [IO.unit, n - 1];
      }
    }).flatten.asUnit;
  }

  get count(): UIO<number> {
    return this._count.get;
  }

  get increment(): UIO<void> {
    return this._count.update((n) => n + 1);
  }

  get isOpen(): UIO<boolean> {
    return this._count.get.map((count) => count === 0);
  }
}

/**
 * @tsplus static fncts.io.CountdownLatchOps make
 * @tsplus static fncts.io.CountdownLatchOps __call
 */
export function make(n: number): UIO<CountdownLatch> {
  return Do((Δ) => {
    const count   = Δ(Ref.make(n));
    const waiters = Δ(Future.make<never, void>());
    return new CountdownLatch(count, waiters);
  });
}
