import type { ChildExecutorDecision } from "@fncts/io/Channel/ChildExecutorDecision/definition";

/**
 * @tsplus pipeable fncts.io.Channel.ChildExecutorDecision match
 */
export function match<A, B, C>(onContinue: () => A, onClose: (value: any) => B, onYield: () => C) {
  return (d: ChildExecutorDecision): A | B | C => {
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
  };
}
