import type { LogSpan } from "../LogSpan.js";
import type { Scheduler } from "@fncts/io/internal/Scheduler.js";

import { identity } from "@fncts/base/data/function";
import { Patch } from "@fncts/base/data/Patch";
import { defaultScheduler } from "@fncts/io/internal/Scheduler";

import { IsFatal } from "../internal/IsFatal.js";
import { FiberRefInternal } from "./definition.js";

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

/**
 * @tsplus static fncts.io.FiberRefOps currentScheduler
 */
export const currentScheduler = FiberRef.unsafeMake<Scheduler>(defaultScheduler);

/**
 * @tsplus static fncts.io.FiberRefOps currentSupervisor
 */
export const currentSupervisor = FiberRef.unsafeMake<Supervisor<any>>(Supervisor.none);

/**
 * @tsplus static fncts.io.FiberRefOps currentIsFatal
 */
export const currentIsFatal = FiberRef.unsafeMake<IsFatal>(IsFatal.empty);

/**
 * @tsplus static fncts.io.FiberRefOps currentReportFatal
 */
export const currentReportFatal = FiberRef.unsafeMake<(t: unknown) => never>((t) => {
  throw t;
});
