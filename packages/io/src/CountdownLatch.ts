export const CountdownLatchTypeId = Symbol.for("fncts.io.CountdownLatch");
export type CountdownLatchTypeId = typeof CountdownLatchTypeId;

/**
 * @tsplus type fncts.io.CountdownLatch
 * @tsplus companion fncts.io.CountdownLatchOps
 */
export class CountdownLatch {
  readonly _typeId: CountdownLatchTypeId = CountdownLatchTypeId;
  constructor(private _count: Ref<number>, private _waiters: Future<never, void>) {}

  readonly await: UIO<void> = this._waiters.await;

  readonly countDown: UIO<void> = this._count.modify((n) => {
    if (n === 0) {
      return [IO.unit, 0];
    } else if (n === 1) {
      return [this._waiters.succeed(undefined), 0];
    } else {
      return [IO.unit, n - 1];
    }
  }).flatten.asUnit;

  readonly count: UIO<number> = this._count.get;

  readonly increment: UIO<void> = this._count.update((n) => n + 1);
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
