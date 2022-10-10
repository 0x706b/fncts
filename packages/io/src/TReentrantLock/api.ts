import type { Lock, LockState } from "./definition.js";

import { RetryException } from "../STM.js";
import { ReadLock, TReentrantLock } from "./definition.js";
import { LockTag, WriteLock } from "./definition.js";

/**
 * @tsplus static fncts.io.TReentrantLock.ReadLockOps empty
 */
export const emptyReadLock: ReadLock = new ReadLock(HashMap.makeDefault());

/**
 * @tsplus static fncts.io.TReentrantLock.ReadLockOps __call
 */
export function makeReadLock(fiberId: FiberId, count: number, __tsplusTrace?: string): ReadLock {
  return count <= 0 ? ReadLock.empty : new ReadLock(HashMap.makeDefault<FiberId, number>().set(fiberId, count));
}

/**
 * @tsplus static fncts.io.TReentrantLockOps make
 * @tsplus static fncts.io.TReentrantLockOps __call
 */
export function make(__tsplusTrace?: string): USTM<TReentrantLock> {
  return TRef.make<LockState>(new ReadLock(HashMap.makeDefault())).map((ref) => new TReentrantLock(ref));
}

/**
 * @tsplus getter fncts.io.TReentrantLock acquireRead
 */
export function acquireRead(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return adjustRead(self, 1);
}

/**
 * @tsplus getter fncts.io.TReentrantLock acquireWrite
 */
export function acquireWrite(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return STM.Effect((journal, fiberId, _) => {
    const lockState = self.data.unsafeGet(journal);
    switch (lockState._tag) {
      case LockTag.ReadLock: {
        if (lockState.noOtherHolder(fiberId)) {
          self.data.unsafeSet(journal, new WriteLock(1, lockState.readLocksHeld(fiberId), fiberId));
          return 1;
        }
        throw new RetryException();
      }
      case LockTag.WriteLock: {
        if (lockState.fiberId == fiberId) {
          self.data.unsafeSet(journal, new WriteLock(lockState.writeLocks + 1, lockState.readLocks, fiberId));
          return lockState.writeLocks + 1;
        }
        throw new RetryException();
      }
    }
  });
}

/**
 * @tsplus getter fncts.io.TReentrantLock releaseRead
 */
export function releaseRead(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return adjustRead(self, -1);
}

/**
 * @tsplus getter fncts.io.TReentrantLock releaseWrite
 */
export function releaseWrite(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return STM.Effect((journal, fiberId) => {
    const lockState: LockState = self.data.unsafeGet(journal);
    let res: LockState | undefined;
    if (lockState._tag === LockTag.WriteLock && lockState.fiberId == fiberId) {
      if (lockState.writeLocks === 1) {
        res = new ReadLock(HashMap.makeDefault<FiberId, number>().set(fiberId, lockState.readLocks));
      }
      if (lockState.writeLocks > 1) {
        res = new WriteLock(lockState.writeLocks - 1, lockState.readLocks, fiberId);
      }
    }
    if (!res) {
      throw new Error(`Defect: Fiber ${fiberId.threadName} releasing write lock it does not hold`);
    }
    self.data.unsafeSet(journal, res);
    return res.writeLocksHeld(fiberId);
  });
}

/**
 * @tsplus pipeable fncts.io.TReentrantLock withReadLock
 */
export function withReadLock<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string) {
  return (self: TReentrantLock): IO<R, E, A> => {
    return IO.uninterruptibleMask(
      ({ restore }) => restore(self.acquireRead.commit) > restore(io).ensuring(self.releaseRead.commit),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.TReentrantLock withWriteLock
 */
export function withWriteLock<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string) {
  return (self: TReentrantLock): IO<R, E, A> => {
    return IO.uninterruptibleMask(
      ({ restore }) => restore(self.acquireWrite.commit) > restore(io).ensuring(self.releaseWrite.commit),
    );
  };
}

/**
 * @tsplus getter fncts.io.TReentrantLock readLock
 */
export function readLock(self: TReentrantLock, __tsplusTrace?: string): IO<Scope, never, number> {
  return self.acquireRead.commit.acquireRelease(() => self.releaseRead.commit);
}

/**
 * @tsplus getter fncts.io.TReentrantLock writeLock
 */
export function writeLock(self: TReentrantLock, __tsplusTrace?: string): IO<Scope, never, number> {
  return self.acquireWrite.commit.acquireRelease(() => self.releaseWrite.commit);
}

/**
 * @tsplus getter fncts.io.TReentrantLock readLocked
 */
export function readLocked(self: TReentrantLock, __tsplusTrace?: string): USTM<boolean> {
  return self.data.get.map((state) => state.readLocks > 0);
}

/**
 * @tsplus getter fncts.io.TReentrantLock writeLocked
 */
export function writeLocked(self: TReentrantLock, __tsplusTrace?: string): USTM<boolean> {
  return self.data.get.map((state) => state.writeLocks > 0);
}

/**
 * @tsplus getter fncts.io.TReentrantLock locked
 */
export function locked(self: TReentrantLock, __tsplusTrace?: string): USTM<boolean> {
  return self.readLocked.zipWith(self.writeLocked, (a, b) => a || b);
}

/**
 * @tsplus getter fncts.io.TReentrantLock fiberReadLocks
 */
export function fiberReadLocks(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return STM.Effect((journal, fiberId) => self.data.unsafeGet(journal).readLocksHeld(fiberId));
}

/**
 * @tsplus getter fncts.io.TReentrantLock fiberWriteLocks
 */
export function fiberWriteLocks(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return STM.Effect((journal, fiberId) => self.data.unsafeGet(journal).writeLocksHeld(fiberId));
}

/**
 * @tsplus getter fncts.io.TReentrantLock writeLocks
 */
export function writeLocks(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return self.data.get.map((state) => state.writeLocks);
}

/**
 * @tsplus getter fncts.io.TReentrantLock readLocks
 */
export function readLocks(self: TReentrantLock, __tsplusTrace?: string): USTM<number> {
  return self.data.get.map((state) => state.readLocks);
}

function adjustRead(self: TReentrantLock, delta: number, __tsplusTrace?: string): USTM<number> {
  return STM.Effect((journal, fiberId, _) => {
    const lockState = self.data.unsafeGet(journal);
    switch (lockState._tag) {
      case LockTag.ReadLock: {
        const res = lockState.adjust(fiberId, delta);
        self.data.unsafeSet(journal, res);
        return res.readLocksHeld(fiberId);
      }
      case LockTag.WriteLock: {
        if (!lockState.fiberId == fiberId) {
          throw new RetryException();
        }
        const newTotal = lockState.writeLocks + delta;
        if (newTotal < 0) {
          throw new Error(`Defect: Fiber ${lockState.fiberId.threadName} releasing read lock it does not hold`);
        } else {
          self.data.unsafeSet(journal, new WriteLock(lockState.writeLocks, newTotal, lockState.fiberId));
        }
        return newTotal;
      }
    }
  });
}
