export interface PullAfterNext<A> {
  readonly _tag: "PullAfterNext";
  readonly emitSeparator: Maybe<A>;
}

/**
 * @tsplus static fncts.io.Channel.UpstreamPullStrategyOps PullAfterNext
 */
export function PullAfterNext<A>(emitSeparator: Maybe<A>): UpstreamPullStrategy<A> {
  return {
    _tag: "PullAfterNext",
    emitSeparator,
  };
}

export interface PullAfterAllEnqueued<A> {
  readonly _tag: "PullAfterAllEnqueued";
  readonly emitSeparator: Maybe<A>;
}

/**
 * @tsplus static fncts.io.Channel.UpstreamPullStrategyOps PullAfterAllEnqueued
 */
export function PullAfterAllEnqueued<A>(emitSeparator: Maybe<A>): UpstreamPullStrategy<A> {
  return {
    _tag: "PullAfterAllEnqueued",
    emitSeparator,
  };
}

export type UpstreamPullStrategy<A> = PullAfterNext<A> | PullAfterAllEnqueued<A>;

/**
 * @tsplus type fncts.io.Channel.UpstreamPullStrategyOps
 */
export interface UpstreamPullStrategyOps {}

export const UpstreamPullStrategy: UpstreamPullStrategyOps = {};
