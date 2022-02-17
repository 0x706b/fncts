import type { Cause } from "../definition";

import { Stack } from "../../../internal/Stack";
import { CauseTag } from "../definition";

/**
 * Determines whether the `Cause` is `Empty` by recursively traversing the `Cause`
 *
 * @tsplus getter fncts.data.Cause isEmpty
 */
export function isEmpty<E>(cause: Cause<E>): boolean {
  if (cause._tag === CauseTag.Empty) {
    return true;
  }
  let causes: Stack<Cause<E>> | undefined = undefined;
  let current: Cause<E> | undefined       = cause;
  while (current) {
    switch (current._tag) {
      case CauseTag.Halt: {
        return false;
      }
      case CauseTag.Fail: {
        return false;
      }
      case CauseTag.Interrupt: {
        return false;
      }
      case CauseTag.Then: {
        causes  = Stack.make(current.right, causes);
        current = current.left;
        break;
      }
      case CauseTag.Both: {
        causes  = Stack.make(current.right, causes);
        current = current.left;
        break;
      }
      default: {
        current = undefined;
      }
    }
    if (!current && causes) {
      current = causes.value;
      causes  = causes.previous;
    }
  }

  return true;
}
