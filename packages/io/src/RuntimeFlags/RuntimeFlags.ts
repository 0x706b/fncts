import type { RuntimeFlagsPatch } from "./Patch.js";

import { RuntimeFlag } from "../RuntimeFlag.js";

/**
 * @tsplus type fncts.io.RuntimeFlags
 */
export type RuntimeFlags = number & {
  readonly RuntimeFlags: unique symbol;
};

/**
 * @tsplus type fncts.io.RuntimeFlagsOps
 */
export interface RuntimeFlagsOps {}

export const RuntimeFlags: RuntimeFlagsOps = Newtype();

export declare namespace RuntimeFlags {
  type Patch = RuntimeFlagsPatch;
}

/**
 * @tsplus static fncts.io.RuntimeFlagsOps __call
 */
export function makeRuntimeFlags(...flags: ReadonlyArray<RuntimeFlag>): RuntimeFlags {
  return flags.reduce((b, a) => b | a, 0) as unknown as RuntimeFlags;
}

/**
 * @tsplus fluent fncts.io.RuntimeFlags isEnabled
 */
export function isEnabled(flags: RuntimeFlags, flag: RuntimeFlag): boolean {
  return (flags & flag) !== 0;
}

/**
 * @tsplus fluent fncts.io.RuntimeFlags enable
 */
export function enable(flags: RuntimeFlags, flag: RuntimeFlag): RuntimeFlags {
  return (flags | flag) as RuntimeFlags;
}

/**
 * @tsplus getter fncts.io.RuntimeFlags cooperativeYielding
 */
export function cooperativeYielding(flags: RuntimeFlags): boolean {
  return flags.isEnabled(RuntimeFlag.CooperativeYielding);
}

/**
 * @tsplus getter fncts.io.RuntimeFlags currentFiber
 */
export function currentFiber(flags: RuntimeFlags): boolean {
  return flags.isEnabled(RuntimeFlag.CurrentFiber);
}

/**
 * @tsplus getter fncts.io.RuntimeFlags fiberRoots
 */
export function fiberRoots(flags: RuntimeFlags): boolean {
  return flags.isEnabled(RuntimeFlag.FiberRoots);
}

/**
 * @tsplus getter fncts.io.RuntimeFlags interruption
 */
export function interruption(flags: RuntimeFlags): boolean {
  return flags.isEnabled(RuntimeFlag.Interruption);
}

/**
 * @tsplus getter fncts.io.RuntimeFlags windDown
 */
export function windDown(flags: RuntimeFlags): boolean {
  return flags.isEnabled(RuntimeFlag.WindDown);
}

/**
 * @tsplus getter fncts.io.RuntimeFlags opSupervision
 */
export function opSpervision(flags: RuntimeFlags): boolean {
  return flags.isEnabled(RuntimeFlag.OpSupervision);
}

/**
 * @tsplus getter fncts.io.RuntimeFlags interruptible
 */
export function interruptible(flags: RuntimeFlags): boolean {
  return interruption(flags) && !windDown(flags);
}

/**
 * @tsplus fluent fncts.io.RuntimeFlags diff
 */
export function diff(oldValue: RuntimeFlags, newValue: RuntimeFlags) {
  return RuntimeFlags.Patch(oldValue ^ newValue, newValue);
}

/**
 * @tsplus static fncts.io.RuntimeFlagsOps none
 */
export const none = 0 as RuntimeFlags;

/**
 * @tsplus static fncts.io.RuntimeFlagsOps default
 */
export const defaultRuntimeFlags = RuntimeFlags(
  RuntimeFlag.FiberRoots,
  RuntimeFlag.Interruption,
  RuntimeFlag.CooperativeYielding,
);
