import type { Has, HasTypeId } from "../../prelude.js";

import { hasTypeId, isObject } from "../../util/predicates.js";
import { Maybe, Nothing } from "../Maybe.js";
import { Tag } from "./definition.js";
import { TagTypeId } from "./definition.js";

/**
 * @tsplus getter fncts.data.Tag fixed
 */
export function fixed<T>(self: Tag<T>): Tag<T> {
  return Tag(self.key, false);
}

/**
 * @tsplus fluent fncts.data.Tag in
 */
export function in_<T, R>(self: Tag<T>, environment: R): environment is R & Has<T> {
  return isObject(environment) && self.key in environment;
}

/**
 * @tsplus static fncts.data.TagOps isTag
 */
export function isTag(u: unknown): u is Tag<unknown> {
  return hasTypeId(u, TagTypeId);
}

/**
 * @tsplus fluent fncts.data.Tag mergeEnvironments
 */
export function mergeEnvironments<T, R1>(tag: Tag<T>, environment: R1, service: T): R1 & Has<T> {
  return tag.isOverridable && tag.in(environment)
    ? environment
    : ({
        ...environment,
        [tag.key]: service,
      } as any);
}

/**
 * @tsplus fluent fncts.data.Tag of
 */
export function of_<T>(self: Tag<T>, service: T): Has<T> {
  return { [self.key]: service } as unknown as Has<T>;
}

/**
 * @tsplus getter fncts.data.Tag overridable
 */
export function overridable<T>(self: Tag<T>): Tag<T> {
  return Tag(self.key, true);
}

/**
 * @tsplus fluent fncts.data.Tag read
 */
export function read_<T, R extends Has<T>>(self: Tag<T>, environment: R): T {
  return environment[self.key];
}

/**
 * @tsplus fluent fncts.data.Tag readMaybe
 */
export function readMaybe_<T>(self: Tag<T>, environment: unknown): Maybe<T> {
  return isObject(environment) ? Maybe.fromNullable(environment[self.key]) : Nothing();
}

/**
 * Replaces the service with the required Service Entry, in the specified environment
 */
export function replaceServiceIn_<R extends Has<T>, T>(
  environment: R,
  tag: Tag<T>,
  f: (t: T) => T,
): R & Has<T> {
  return {
    ...environment,
    [tag.key]: f(environment[tag.key as HasTypeId] as any),
  } as any;
}

/**
 * @tsplus fluent fncts.data.Tag setKey
 */
export function setKey_<T>(self: Tag<T>, key: PropertyKey): Tag<T> {
  return Tag(key, self.isOverridable);
}
