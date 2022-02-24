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
 * @tsplus static fncts.data.ExecutionStrategyOps sequential
 */
export const sequential: Sequential = {
  _tag: "Sequential",
};

/**
 * @tsplus static fncts.data.ExecutionStrategyOps concurrent
 */
export const concurrent: Concurrent = {
  _tag: "Concurrent",
};

/**
 * @tsplus static fncts.data.ExecutionStrategyOps concurrentBounded
 */
export function concurrentBounded(fiberBound: number): ConcurrentBounded {
  return {
    _tag: "ConcurrentBounded",
    fiberBound,
  };
}

/**
 * @tsplus type fncts.data.ExecutionStrategy
 */
export type ExecutionStrategy = Sequential | Concurrent | ConcurrentBounded;

/**
 * @tsplus type fncts.data.ExecutionStrategyOps
 */
export interface ExecutionStrategyOps {}

export const ExecutionStrategy: ExecutionStrategyOps = {};

/**
 * @tsplus fluent fncts.data.ExecutionStrategy match
 */
export function match_<A, B, C>(
  strategy: ExecutionStrategy,
  sequential: () => A,
  concurrent: () => B,
  concurrentBounded: (fiberBound: number) => C,
): A | B | C {
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
}

/**
 * @tsplus pipeable fncts.data.ExecutionStrategy match
 */
export function match<A, B, C>(
  sequential: () => A,
  concurrent: () => B,
  concurrentBounded: (fiberBound: number) => C,
): (strategy: ExecutionStrategy) => A | B | C {
  return (strategy) => match_(strategy, sequential, concurrent, concurrentBounded);
}
