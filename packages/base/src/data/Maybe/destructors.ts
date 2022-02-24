import type { Maybe } from "./definition";

import { MaybeTag } from "./definition";

/**
 * Matches on each case of a `Maybe`, returning the result of `nothing` if the `Maybe`
 * is `Nothing`, or returning the result of `just` if it is `Just`
 *
 * @tsplus fluent fncts.data.Maybe match
 */
export function match_<A, B, C>(self: Maybe<A>, nothing: () => B, just: (a: A) => C): B | C {
  return self._tag === MaybeTag.Just ? just(self.value) : nothing();
}

// codegen:start { preset: pipeable }
/**
 * Matches on each case of a `Maybe`, returning the result of `nothing` if the `Maybe`
 * is `Nothing`, or returning the result of `just` if it is `Just`
 * @tsplus dataFirst match_
 */
export function match<A, B, C>(nothing: () => B, just: (a: A) => C) {
  return (self: Maybe<A>): B | C => match_(self, nothing, just);
}
// codegen:end
