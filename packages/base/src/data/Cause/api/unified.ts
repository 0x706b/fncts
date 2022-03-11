import type { List } from "../../../collection/immutable/List";
import type { Cause, Fail, Halt, Interrupt } from "../definition";

import { _Nil, Cons } from "../../../collection/immutable/List";
import { show } from "../../../prelude/Showable";
import { FiberId } from "../../FiberId";
import { CauseTag, Unified } from "../definition";

function unifyFail<E>(fail: Fail<E>): Unified {
  return new Unified(fail.trace.fiberId, show(fail.value).split("\n"), fail.trace.toJS);
}

function unifyHalt(halt: Halt): Unified {
  return new Unified(halt.trace.fiberId, show(halt.value).split("\n"), halt.trace.toJS);
}

function unifyInterrupt(interrupt: Interrupt): Unified {
  return new Unified(
    interrupt.trace.fiberId,
    [`Interrupted by fiber ${interrupt.id.threadName}`],
    interrupt.trace.toJS,
  );
}

/**
 * @tsplus tailRec
 */
function unifyLoop<E>(
  causes: List<Cause<E>>,
  fiberId: FiberId,
  stackless: boolean,
  result: List<Unified>,
): List<Unified> {
  if (causes.isEmpty()) {
    return result;
  }
  const head = causes.head;
  const more = causes.tail;
  switch (head._tag) {
    case CauseTag.Empty:
      return unifyLoop(more, fiberId, stackless, result);
    case CauseTag.Both:
      return unifyLoop(Cons(head.left, Cons(head.right, more)), fiberId, stackless, result);
    case CauseTag.Then:
      return unifyLoop(Cons(head.left, Cons(head.right, more)), fiberId, stackless, result);
    case CauseTag.Stackless:
      return unifyLoop(Cons(head.cause, more), fiberId, head.stackless, result);
    case CauseTag.Fail:
      return unifyLoop(more, fiberId, stackless, Cons(unifyFail(head), result));
    case CauseTag.Halt:
      return unifyLoop(more, fiberId, stackless, Cons(unifyHalt(head), result));
    case CauseTag.Interrupt:
      return unifyLoop(more, fiberId, stackless, Cons(unifyInterrupt(head), result));
  }
}

/**
 * @tsplus getter fncts.data.Cause unified
 */
export function unified<E>(self: Cause<E>): List<Unified> {
  return unifyLoop(Cons(self, _Nil), FiberId.none, false, _Nil).reverse;
}
