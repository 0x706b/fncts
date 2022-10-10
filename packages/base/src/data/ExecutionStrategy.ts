export interface Sequential {
  readonly _tag: "Sequential";
}

export interface Concurrent {
  readonly _tag: "Concurrent";
}

export interface ConcurrentBounded {
  readonly _tag: "ConcurrentBounded";
  readonly fiberBound: number;
}

/**
 * @tsplus static fncts.ExecutionStrategyOps sequential
 */
export const sequential: Sequential = {
  _tag: "Sequential",
};

/**
 * @tsplus static fncts.ExecutionStrategyOps concurrent
 */
export const concurrent: Concurrent = {
  _tag: "Concurrent",
};

/**
 * @tsplus static fncts.ExecutionStrategyOps concurrentBounded
 */
export function concurrentBounded(fiberBound: number): ConcurrentBounded {
  return {
    _tag: "ConcurrentBounded",
    fiberBound,
  };
}

/**
 * @tsplus type fncts.ExecutionStrategy
 */
export type ExecutionStrategy = Sequential | Concurrent | ConcurrentBounded;

/**
 * @tsplus type fncts.ExecutionStrategyOps
 */
export interface ExecutionStrategyOps {}

export const ExecutionStrategy: ExecutionStrategyOps = {};

/**
 * @tsplus pipeable fncts.ExecutionStrategy match
 */
export function match_<A, B, C>(
  sequential: () => A,
  concurrent: () => B,
  concurrentBounded: (fiberBound: number) => C,
) {
  return (strategy: ExecutionStrategy): A | B | C => {
    switch (strategy._tag) {
      case "Sequential": {
        return sequential();
      }
      case "Concurrent": {
        return concurrent();
      }
      case "ConcurrentBounded": {
        return concurrentBounded(strategy.fiberBound);
      }
    }
  };
}
