import type { UpstreamPullRequest } from "@fncts/io/Channel/UpstreamPullRequest/definition";

import { NoUpstream, Pulled } from "@fncts/io/Channel/UpstreamPullRequest/definition";

/**
 * @tsplus pipeable fncts.io.Channel.UpstreamPullRequest match
 */
export function match<A, B, C>(pulled: (value: A) => B, noUpstream: (activeDownstreamCount: number) => C) {
  return (upr: UpstreamPullRequest<A>): B | C => {
    switch (upr._tag) {
      case "Pulled": {
        return pulled(upr.value);
      }
      case "NoUpstream": {
        return noUpstream(upr.activeDownstreamCount);
      }
    }
  };
}

/**
 * @tsplus static fncts.io.Channel.UpstreamPullRequestOps Pulled
 */
export function pulled<A>(value: A): UpstreamPullRequest<A> {
  return new Pulled(value);
}

/**
 * @tsplus static fncts.io.Channel.UpstreamPullRequestOps NoUpstream
 */
export function noUpstream<A = never>(activeDownstreamCount: number): UpstreamPullRequest<A> {
  return new NoUpstream(activeDownstreamCount);
}
