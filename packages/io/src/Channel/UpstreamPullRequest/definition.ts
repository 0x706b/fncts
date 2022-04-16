export class Pulled<A> {
  readonly _tag = "Pulled";
  constructor(readonly value: A) {}
}

export class NoUpstream {
  readonly _tag = "NoUpstream";
  constructor(readonly activeDownstreamCount: number) {}
}

/**
 * @tsplus type fncts.io.Channel.UpstreamPullRequest
 */
export type UpstreamPullRequest<A> = Pulled<A> | NoUpstream;

/**
 * @tsplus type fncts.io.Channel.UpstreamPullRequestOps
 */
export interface UpstreamPullRequestOps {}

export const UpstreamPullRequest: UpstreamPullRequestOps = {};
