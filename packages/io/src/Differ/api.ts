import type { Environment } from "@fncts/base/data/Environment";

import { EnvironmentPatch } from "@fncts/base/data/EnvironmentPatch";

import { Differ } from "./definition.js";

/**
 * Constructs a differ that just diffs two values by returning a function that
 * sets the value to the new value. This differ does not support combining
 * multiple updates to the value compositionally and should only be used when
 * there is no compositional way to update them.
 *
 * @tsplus static fncts.io.DifferOps update
 */
export function update<A>(): Differ<A, (_: A) => A> {
  return new (class extends Differ<A, (_: A) => A> {
    combine(first: (_: A) => A, second: (_: A) => A): (_: A) => A {
      if (first === this.empty) return second;
      else if (second === this.empty) return first;
      return first.compose(second);
    }
    diff(oldValue: A, newValue: A): (_: A) => A {
      if (oldValue === newValue) return this.empty;
      else return () => newValue;
    }
    empty = Function.identity;
    patch(patch: (_: A) => A): (oldValue: A) => A {
      return patch;
    }
  })();
}

/**
 * Constructs a differ that knows how to diff `ZEnvironment` values.
 *
 * @tsplus static fncts.io.DifferOps environment
 */
export function environment<A>(): Differ<Environment<A>, Environment.Patch<A, A>> {
  return new (class extends Differ<Environment<A>, Environment.Patch<A, A>> {
    combine(first: Environment.Patch<A, A>, second: Environment.Patch<A, A>): Environment.Patch<A, A> {
      return first.compose(second);
    }
    diff(oldValue: Environment<A>, newValue: Environment<A>): Environment.Patch<A, A> {
      return EnvironmentPatch.diff(oldValue, newValue);
    }
    empty = EnvironmentPatch.empty<A>();
    patch(patch: Environment.Patch<A, A>): (oldValue: Environment<A>) => Environment<A> {
      return (oldValue) => patch(oldValue);
    }
  })();
}
