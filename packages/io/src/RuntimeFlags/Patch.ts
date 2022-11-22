import type { RuntimeFlag } from "../RuntimeFlag.js";

import { RuntimeFlags } from "./RuntimeFlags.js";

/**
 * @tsplus type fncts.io.RuntimeFlagsPatch
 */
export type RuntimeFlagsPatch = number & {
  readonly RuntimeFlagsPatch: unique symbol;
};

/**
 * @tsplus type fncts.io.RuntimeFlagsPatchOps
 */
export interface RuntimeFlagsPatchOps {}

/**
 * @tsplus static fncts.io.RuntimeFlagsOps Patch
 */
export const RuntimeFlagsPatch: RuntimeFlagsPatchOps = Newtype();

/**
 * @tsplus static fncts.io.RuntimeFlagsPatchOps __call
 */
export function makeRuntimeFlagsPatch(active: number, enabled: number): RuntimeFlags.Patch {
  return ((active << 0) + ((enabled & active) << 16)) as RuntimeFlags.Patch;
}

/**
 * @tsplus static fncts.io.RuntimeFlagsOps enable
 */
export function mkEnable(flag: RuntimeFlag): RuntimeFlags.Patch {
  return RuntimeFlags.Patch(flag, flag);
}

/**
 * @tsplus static fncts.io.RuntimeFlagsOps disable
 */
export function mkDisable(flag: RuntimeFlag): RuntimeFlags.Patch {
  return RuntimeFlags.Patch(flag, 0);
}

/**
 * @tsplus fluent fncts.io.RuntimeFlagsPatch isActive
 */
export function isActive(patch: RuntimeFlags.Patch, flag: RuntimeFlag): boolean {
  return (active(patch) & flag) !== 0;
}

/**
 * @tsplus fluent fncts.io.RuntimeFlagsPatch isEnabled
 */
export function isEnabledPatch(patch: RuntimeFlags.Patch, flag: RuntimeFlag): boolean {
  return patch.isActive(flag) && (enabled(patch) & flag) !== 0;
}

/**
 * @tsplus fluent fncts.io.RuntimeFlagsPatch patch
 */
export function patch(patch: RuntimeFlags.Patch, flags: RuntimeFlags): RuntimeFlags {
  return ((flags & (~active(patch) | enabled(patch))) | (active(patch) & enabled(patch))) as RuntimeFlags;
}

/**
 * @tsplus fluent fncts.io.RuntimeFlagsPatch exclude
 */
export function exclude(patch: RuntimeFlags.Patch, flag: RuntimeFlag): RuntimeFlags.Patch {
  return RuntimeFlags.Patch(active(patch) & ~flag, enabled(patch));
}

const base = 0xffffffff | 0;

function active(patch: RuntimeFlags.Patch): number {
  return (patch >> 0) & base;
}

function enabled(patch: RuntimeFlags.Patch): number {
  return (patch >> 16) & base;
}
