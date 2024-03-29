import { MaybeTag } from "./definition.js";

/**
 * Matches on each case of a `Maybe`, returning the result of `nothing` if the `Maybe`
 * is `Nothing`, or returning the result of `just` if it is `Just`
 *
 * @tsplus pipeable fncts.Maybe match
 */
export function match<A, B, C>(nothing: () => B, just: (a: A) => C) {
  return (self: Maybe<A>): B | C => {
    self.concrete();
    return self._tag === MaybeTag.Just ? just(self.value) : nothing();
  };
}
