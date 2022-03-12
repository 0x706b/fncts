import type { ChildExecutorDecision } from "./definition.js";

/**
 * @tsplus fluent fncts.control.Channel.ChildExecutorDecision match
 */
export function match_<A, B, C>(
  d: ChildExecutorDecision,
  onContinue: () => A,
  onClose: (value: any) => B,
  onYield: () => C,
): A | B | C {
  switch (d._tag) {
    case "Continue": {
      return onContinue();
    }
    case "Close": {
      return onClose(d.value);
    }
    case "Yield": {
      return onYield();
    }
  }
}
