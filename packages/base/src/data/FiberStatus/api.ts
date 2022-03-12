import type { Done, FiberStatus } from "./definition.js";

import { FiberStatusTag, Finishing, Running, Suspended } from "./definition.js";

/**
 * @tsplus getter fncts.data.FiberStatus isInterrupting
 * @tsplus tailRec
 */
export function isInterrupting(self: FiberStatus): boolean {
  switch (self._tag) {
    case FiberStatusTag.Done:
      return false;
    case FiberStatusTag.Suspended:
      return isInterrupting(self.previous);
    default:
      return self.interrupting;
  }
}

/**
 * @tsplus fluent fncts.data.FiberStatus withInterrupting
 */
export function withInterrupting(self: FiberStatus, b: boolean): FiberStatus {
  switch (self._tag) {
    case FiberStatusTag.Done:
      return self;
    case FiberStatusTag.Finishing:
      return new Finishing(b);
    case FiberStatusTag.Running:
      return new Running(b);
    case FiberStatusTag.Suspended:
      return new Suspended(
        withInterrupting(self.previous, b),
        self.interruptible,
        self.epoch,
        self.blockingOn,
      );
  }
}

/**
 * @tsplus getter fncts.data.FiberStatus toFinishing
 * @tsplus tailRec
 */
export function toFinishing(self: FiberStatus): FiberStatus {
  switch (self._tag) {
    case FiberStatusTag.Suspended:
      return toFinishing(self.previous);
    default:
      return self;
  }
}

/**
 * @tsplus fluent fncts.data.FiberStatus isDone
 */
export function isDone(s: FiberStatus): s is Done {
  return s._tag === FiberStatusTag.Done;
}
