import type { FiberId } from "../../FiberId";
import type { Trace } from "../../Trace";
import type { Cause } from "../definition";

import { Eval } from "../../../control/Eval";
import { CauseTag } from "../definition";

/**
 * @internal
 */
function foldEval<E, A>(
  cause: Cause<E>,
  onEmpty: () => A,
  onFail: (reason: E, trace: Trace) => A,
  onHalt: (reason: unknown, trace: Trace) => A,
  onInterrupt: (id: FiberId, trace: Trace) => A,
  onThen: (l: A, r: A) => A,
  onBoth: (l: A, r: A) => A,
): Eval<A> {
  switch (cause._tag) {
    case CauseTag.Empty:
      return Eval.now(onEmpty());
    case CauseTag.Fail:
      return Eval.now(onFail(cause.value, cause.trace));
    case CauseTag.Halt:
      return Eval.now(onHalt(cause.value, cause.trace));
    case CauseTag.Interrupt:
      return Eval.now(onInterrupt(cause.id, cause.trace));
    case CauseTag.Both:
      return Eval.defer(() => foldEval(cause.left, onEmpty, onFail, onHalt, onInterrupt, onThen, onBoth)).zipWith(
        Eval.defer(() => foldEval(cause.right, onEmpty, onFail, onHalt, onInterrupt, onThen, onBoth)),
        onBoth,
      );
    case CauseTag.Then:
      return Eval.defer(() => foldEval(cause.left, onEmpty, onFail, onHalt, onInterrupt, onThen, onBoth)).zipWith(
        Eval.defer(() => foldEval(cause.right, onEmpty, onFail, onHalt, onInterrupt, onThen, onBoth)),
        onThen,
      );
  }
}

/**
 * Folds over a cause
 *
 * @tsplus fluent fncts.data.Cause fold
 */
export function fold_<E, A>(
  cause: Cause<E>,
  onEmpty: () => A,
  onFail: (e: E, trace: Trace) => A,
  onHalt: (u: unknown, trace: Trace) => A,
  onInterrupt: (id: FiberId, trace: Trace) => A,
  onThen: (l: A, r: A) => A,
  onBoth: (l: A, r: A) => A,
): A {
  return Eval.run(foldEval(cause, onEmpty, onFail, onHalt, onInterrupt, onThen, onBoth));
}

// codegen:start { preset: pipeable }
/**
 * Folds over a cause
 * @tsplus dataFirst fold_
 */
export function fold<E, A>(
  onEmpty: () => A,
  onFail: (e: E, trace: Trace) => A,
  onHalt: (u: unknown, trace: Trace) => A,
  onInterrupt: (id: FiberId, trace: Trace) => A,
  onThen: (l: A, r: A) => A,
  onBoth: (l: A, r: A) => A,
) {
  return (cause: Cause<E>): A => fold_(cause, onEmpty, onFail, onHalt, onInterrupt, onThen, onBoth);
}
// codegen:end
