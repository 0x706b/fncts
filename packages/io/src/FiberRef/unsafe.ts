import type { LogSpan } from "../LogSpan.js";
import type { Scheduler } from "@fncts/io/internal/Scheduler.js";

import { EnvironmentPatch } from "@fncts/base/data/EnvironmentPatch";
import { identity } from "@fncts/base/data/function";
import { Differ } from "@fncts/io/Differ/definition";
import { defaultScheduler } from "@fncts/io/internal/Scheduler";

import { IsFatal } from "../internal/IsFatal.js";
import { FiberRefInternal } from "./definition.js";

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMakePatch
 */
export function unsafeMakePatch<Value, Patch>(
  initial: Value,
  differ: Differ<Value, Patch>,
  fork: Patch,
  join: (oldValue: Value, newValue: Value) => Value = (_, newValue) => newValue,
): FiberRef.WithPatch<Value, Patch> {
  return new FiberRefInternal(
    initial,
    (oldValue, newValue) => differ.diff(oldValue, newValue),
    (first, second) => differ.combine(first, second),
    (patch) => (oldValue) => differ.patch(patch)(oldValue),
    fork,
    join,
  );
}

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMakeEnvironment
 */
export function unsafeMakeEnvironment<A>(
  initial: Environment<A>,
): FiberRef.WithPatch<Environment<A>, Environment.Patch<A, A>> {
  return FiberRef.unsafeMakePatch(initial, Differ.environment(), EnvironmentPatch.empty());
}

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMakeSupervisor
 */
export function unsafeMakeSupervisor(initial: Supervisor<any>): FiberRef.WithPatch<Supervisor<any>, SupervisorPatch> {
  return FiberRef.unsafeMakePatch(initial, Differ.supervisor(), SupervisorPatch.empty);
}

/**
 * @tsplus static fncts.io.FiberRefOps unsafeMake
 */
export function unsafeMake<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a0: A, a1: A) => A = (_, a) => a,
): FiberRef.WithPatch<A, (_: A) => A> {
  return FiberRef.unsafeMakePatch(initial, Differ.update(), fork, join);
}

/**
 * @tsplus static fncts.io.FiberRefOps forkScopeOverride
 */
export const forkScopeOverride = FiberRef.unsafeMake<Maybe<FiberScope>>(
  Nothing(),
  () => Nothing(),
  (parent, _) => parent,
);

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
export const currentSupervisor = FiberRef.unsafeMakeSupervisor(Supervisor.none);

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
