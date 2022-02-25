export class Pulled<A> {
  readonly _tag = "Pulled";
  constructor(readonly value: A) {}
}

export class NoUpstream {
  readonly _tag = "NoUpstream";
  constructor(readonly activeDownstreamCount: number) {}
}

/**
 * @tsplus type fncts.control.Channel.UpstreamPullRequest
 */
export type UpstreamPullRequest<A> = Pulled<A> | NoUpstream;

/**
 * @tsplus type fncts.control.Channel.UpstreamPullRequestOps
 */
export interface UpstreamPullRequestOps {}

export const UpstreamPullRequest: UpstreamPullRequestOps = {};

/**
 * @tsplus fluent fncts.control.Channel.UpstreamPullRequest match
 */
export function match_<A, B, C>(
  upr: UpstreamPullRequest<A>,
  pulled: (value: A) => B,
  noUpstream: (activeDownstreamCount: number) => C,
): B | C {
  switch (upr._tag) {
    case "Pulled": {
      return pulled(upr.value);
    }
    case "NoUpstream": {
      return noUpstream(upr.activeDownstreamCount);
    }
  }
}

/**
 * @tsplus static fncts.control.Channel.UpstreamPullRequestOps Pulled
 */
export function pulled<A>(value: A): UpstreamPullRequest<A> {
  return new Pulled(value);
}

/**
 * @tsplus static fncts.control.Channel.UpstreamPullRequestOps NoUpstream
 */
export function noUpstream<A = never>(activeDownstreamCount: number): UpstreamPullRequest<A> {
  return new NoUpstream(activeDownstreamCount);
}
