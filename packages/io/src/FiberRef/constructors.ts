import type { LogSpan } from "@fncts/io/LogSpan";

import { identity } from "@fncts/base/data/function";
import { RuntimeFiberRef } from "@fncts/io/FiberRef/definition";

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMake
 */
export function unsafeMake<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a0: A, a1: A) => A = (_, a) => a,
): FiberRef.Runtime<A> {
  return new RuntimeFiberRef(initial, fork, join);
}

/**
 * @tsplus static fncts.io.FiberRefOps make
 */
export function make<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a: A, a1: A) => A = (_, a) => a,
): UIO<FiberRef.Runtime<A>> {
  return IO.defer(() => {
    const ref = unsafeMake(initial, fork, join);
    return ref.update(identity).as(ref);
  });
}

/**
 * @tsplus static fncts.io.FiberRefOps forkScopeOverride
 */
export const forkScopeOverride = FiberRef.unsafeMake<Maybe<FiberScope>>(Nothing());

/**
 * @tsplus static fncts.io.FiberRefOps currentEnvironment
 */
export const currentEnvironment = FiberRef.unsafeMake<Environment<unknown>>(Environment.empty, identity, (a, _) => a);

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
