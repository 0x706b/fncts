import type { LogSpan } from "@fncts/io/LogSpan";

import { identity } from "@fncts/base/data/function";
import { Patch } from "@fncts/base/data/Patch";
import { FiberRefInternal } from "@fncts/io/FiberRef/definition";

function makeWith<Value, Patch>(
  ref: Lazy<FiberRef.WithPatch<Value, Patch>>,
): IO<Has<Scope>, never, FiberRef.WithPatch<Value, Patch>> {
  return IO.acquireRelease(
    IO.succeed(ref).tap((ref) => ref.update(identity)),
    (ref) => ref.remove,
  );
}

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMakePatch
 */
export function unsafeMakePatch<Value, Patch>(
  initial: Value,
  diff: (oldValue: Value, newValue: Value) => Patch,
  combine: (first: Patch, second: Patch) => Patch,
  patch: (patch: Patch) => (oldValue: Value) => Value,
  fork: Patch,
): FiberRef.WithPatch<Value, Patch> {
  return new FiberRefInternal(initial, diff, combine, patch, fork);
}

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMakeEnvironment
 */
export function unsafeMakeEnvironment<A>(initial: Environment<A>): FiberRef.WithPatch<Environment<A>, Patch<A, A>> {
  return FiberRef.unsafeMakePatch(
    initial,
    Patch.diff,
    (first, second) => first.compose(second),
    (patch) => (value) => patch(value),
    Patch.empty(),
  );
}

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMake
 */
export function unsafeMake<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a0: A, a1: A) => A = (_, a) => a,
): FiberRef.WithPatch<A, (_: A) => A> {
  return FiberRef.unsafeMakePatch(
    initial,
    (_, newValue) => () => newValue,
    (first, second) => (value) => second(first(value)),
    (patch) => (value) => join(value, patch(value)),
    fork,
  );
}

/**
 * @tsplus static fncts.io.FiberRefOps make
 */
export function make<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a: A, a1: A) => A = (_, a) => a,
): IO<Has<Scope>, never, FiberRef<A>> {
  return makeWith(unsafeMake(initial, fork, join));
}

/**
 * @tsplus static fncts.io.FiberRefOps forkScopeOverride
 */
export const forkScopeOverride = FiberRef.unsafeMake<Maybe<FiberScope>>(Nothing(), () => Nothing());

/**
 * @tsplus static fncts.io.FiberRefOps currentEnvironment
 */
export const currentEnvironment = FiberRef.unsafeMakeEnvironment<unknown>(Environment.empty);

/**
 * @tsplus static fncts.io.FiberRefOps fiberName
 */
export const fiberName = FiberRef.unsafeMake<Maybe<string>>(Nothing());

/**
 * @tsplus static fncts.io.FiberRefOps currentLogLevel
 */
export const currentLogLevel = FiberRef.unsafeMake<LogLevel>(LogLevel.Info);

/**
 * @tsplus static fncts.io.FiberRefOps currentLogSpan
 */
export const currentLogSpan = FiberRef.unsafeMake<List<LogSpan>>(Nil());

/**
 * @tsplus static fncts.io.FiberRefOps currentLogAnnotations
 */
export const currentLogAnnotations = FiberRef.unsafeMake<HashMap<string, string>>(HashMap.makeDefault());
