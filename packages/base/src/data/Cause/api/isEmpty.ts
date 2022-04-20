import { Stack } from "../../../internal/Stack.js";
import { CauseTag } from "../definition.js";

/**
 * Determines whether the `Cause` is `Empty` by recursively traversing the `Cause`
 *
 * @tsplus getter fncts.Cause isEmpty
 */
export function isEmpty<E>(cause: Cause<E>): boolean {
  if (cause._tag === CauseTag.Empty) {
    return true;
  }
  const causes: Stack<Cause<E>>     = Stack();
  let current: Cause<E> | undefined = cause;
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
        causes.push(current.right);
        current = current.left;
        break;
      }
      case CauseTag.Both: {
        causes.push(current.right);
        current = current.left;
        break;
      }
      default: {
        current = undefined;
      }
    }
    if (!current && causes) {
      current = causes.pop();
    }
  }

  return true;
}
