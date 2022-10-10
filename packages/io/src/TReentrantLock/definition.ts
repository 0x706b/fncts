/**
 * A `TReentrantLock` is a reentrant read/write lock. Multiple readers may all
 * concurrently acquire read locks. Only one writer is allowed to acquire a
 * write lock at any given time. Read locks may be upgraded into write locks. A
 * fiber that has a write lock may acquire other write locks or read locks.
 *
 * The two primary methods of this structure are `readLock`, which acquires a
 * read lock in a scoped context, and `writeLock`, which acquires a write lock
 * in a scoped context.
 *
 * Although located in the STM package, there is no need for locks within STM
 * transactions. However, this lock can be quite useful in effectful code, to
 * provide consistent read/write access to mutable state; and being in STM
 * allows this structure to be composed into more complicated concurrent
 * structures that are consumed from effectful code.
 *
 * @tsplus type fncts.io.TReentrantLock
 * @tsplus companion fncts.io.TReentrantLockOps
 */
export class TReentrantLock {
  constructor(readonly data: UTRef<LockState>) {}
}
export interface Lock {
  readonly readLocks: number;
  readonly readLocksHeld: (fiberId: FiberId) => number;
  readonly writeLocks: number;
  readonly writeLocksHeld: (fiberId: FiberId) => number;
}
export const enum LockTag {
  WriteLock,
  ReadLock,
}
/**
 * @tsplus type fncts.io.TReentrantLock.WriteLock
 * @tsplus companion fncts.io.TReentrantLock.WriteLockOps
 */
export class WriteLock implements Lock {
  readonly _tag = LockTag.WriteLock;
  constructor(readonly writeLocks: number, readonly readLocks: number, readonly fiberId: FiberId) {}
  readLocksHeld(fiberId: FiberId): number {
    return this.fiberId == fiberId ? this.readLocks : 0;
  }
  writeLocksHeld(fiberId: FiberId): number {
    return this.fiberId == fiberId ? this.writeLocks : 0;
  }
}
/**
 * @tsplus type fncts.io.TReentrantLock.ReadLock
 * @tsplus companion fncts.io.TReentrantLock.ReadLockOps
 */
export class ReadLock implements Lock {
  readonly _tag = LockTag.ReadLock;
  constructor(readonly readers: HashMap<FiberId, number>) {}
  get readLocks() {
    return (this.readers.values as Iterable<number>).sum;
  }
  writeLocks = 0;
  readLocksHeld(fiberId: FiberId) {
    return this.readers.get(fiberId).getOrElse(0);
  }
  writeLocksHeld(_fiberId: FiberId) {
    return 0;
  }
  noOtherHolder(fiberId: FiberId): boolean {
    return this.readers.isEmpty || (this.readers.size === 1 && this.readers.has(fiberId));
  }
  adjust(fiberId: FiberId, adjust: number): ReadLock {
    const total    = this.readLocksHeld(fiberId);
    const newTotal = total + adjust;
    if (newTotal < 0) {
      throw new Error(`Defect: Fiber ${fiberId.threadName} releasing read lock it does not hold`);
    }
    if (newTotal === 0) {
      return new ReadLock(this.readers.remove(fiberId));
    }
    return new ReadLock(this.readers.set(fiberId, newTotal));
  }
}
export type LockState = WriteLock | ReadLock;
