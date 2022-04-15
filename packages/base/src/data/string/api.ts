import { Ord } from "../../typeclass.js";

/**
 * Capitalize the first letter of the string
 *
 * @tsplus getter fncts.String capitalize
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Capitalize the first letter of every word in a string
 *
 * @tsplus getter fncts.String capitalizeAll
 */
export function capitalizeAll(s: string): string {
  return s.split(" ").map(capitalize).join(" ");
}

/**
 * Check is a string is empty
 *
 * @tsplus getter fncts.String isEmpty
 */
export function isEmpty(s: string): boolean {
  return s === "";
}

/**
 * Check is a string is non-empty
 *
 * @tsplus getter fncts.String isNonEmpty
 */
export function isNonEmpty(s: string): boolean {
  return s !== "";
}

/**
 * Split a string into substrings using any recognised newline as the separator.
 *
 * @tsplus getter fncts.String lines
 */
export function lines(s: string): ReadonlyArray<string> {
  return s.split(/\r\n|\r|\n/);
}

/**
 * Reverse a string
 *
 * @tsplus getter fncts.String reverse
 */
export function reverse(s: string): string {
  return s.under((cs) => cs.reverse());
}

/**
 * Surround a string. Equivalent to calling `prepend` and `append` with the
 * same outer value.
 *
 * @tsplus fluent fncts.String surround
 */
export function surround_(s: string, x: string): string {
  return x + s + x;
}

/**
 * Surround a string. Equivalent to calling `prepend` and `append` with the
 * same outer value.
 *
 * @tsplus static fncts.StringOps surround
 */
export const surround = Pipeable(surround_);

/**
 * Keep the specified number of characters from the start of a string.
 *
 * If `n` is larger than the available number of characters, the string will
 * be returned whole.
 *
 * If `n` is not a positive number, an empty string will be returned.
 *
 * If `n` is a float, it will be rounded down to the nearest integer.
 *
 * @tsplus fluent fncts.String take
 */
export function take_(s: string, n: number): string {
  return s.slice(0, Ord.max(Number.Ord)(0, n));
}

/**
 * @tsplus static fncts.StringOps take
 */
export const take = Pipeable(take_);

/**
 * Keep the specified number of characters from the end of a string.
 *
 * If `n` is larger than the available number of characters, the string will
 * be returned whole.
 *
 * If `n` is not a positive number, an empty string will be returned.
 *
 * If `n` is a float, it will be rounded down to the nearest integer.
 *
 * @tsplus fluent fncts.String takeLast
 */
export function takeLast_(s: string, n: number): string {
  return s.slice(Ord.max(Number.Ord)(0, s.length - Math.floor(n)), Infinity);
}

/**
 * @tsplus static fncts.StringOps takeLast
 */
export const takeLast = Pipeable(takeLast_);

/**
 * Removes the given string from the beginning, if it exists
 *
 * @tsplus fluent fncts.String unprepend
 */
export function unprepend_(s: string, s1: string): string {
  return s.startsWith(s1) ? s.slice(s1.length) : s;
}

/**
 * @tsplus static fncts.StringOps unprepend
 */
export const unprepend = Pipeable(unprepend_);

/**
 * Remove the end of a string, if it exists.
 *
 * @tsplus fluent fncts.String unappend
 */
export function unappend_(s: string, x: string): string {
  return s.endsWith(x) ? s.substring(0, s.lastIndexOf(x)) : s;
}

/**
 * @tsplus static fncts.StringOps unappend
 */
export const unappend = Pipeable(unappend_);

/**
 * Remove the start and end of a string, if they both exist.
 *
 * @tsplus fluent fncts.String unsurround
 */
export function unsurround_(s: string, x: string): string {
  return s.startsWith(x) && s.endsWith(x) ? s.unprepend(x).unappend(x) : s;
}

/**
 * @tsplus static fncts.StringOps unsurround
 */
export const unsurround = Pipeable(unsurround_);

/**
 * Apply an endomorphism upon an array of characters against a string.
 * This is useful as it allows you to run many polymorphic functions targeting
 * arrays against strings without having to rewrite them.
 *
 * @tsplus fluent fncts.String under
 */
export function under_(s: string, f: (chars: Array<string>) => Array<string>): string {
  return f(s.split("")).join("");
}

/**
 * @tsplus static fncts.StringOps under
 */
export const under = Pipeable(under_);

/**
 * Join newline-separated strings together.
 *
 * @tsplus getter fncts.base.ImmutableArray unlines
 */
export function unlines(as: ReadonlyArray<string>): string {
  return as.join("\n");
}
