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
 * @tsplus pipeable fncts.String surround
 * @tsplus static fncts.StringOps surround
 */
export function surround(x: string) {
  return (s: string): string => {
    return x + s + x;
  };
}

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
 * @tsplus pipeable fncts.String take
 */
export function take(n: number) {
  return (s: string): string => {
    return s.slice(0, Ord.max(Number.Ord)(n)(0));
  };
}

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
 * @tsplus pipeable fncts.String takeLast
 */
export function takeLast(n: number) {
  return (s: string): string => {
    return s.slice(Ord.max(Number.Ord)(s.length - Math.floor(n))(0), Infinity);
  };
}

/**
 * Removes the given string from the beginning, if it exists
 *
 * @tsplus pipeable fncts.String unprepend
 */
export function unprepend(s1: string) {
  return (s: string): string => {
    return s.startsWith(s1) ? s.slice(s1.length) : s;
  };
}

/**
 * Remove the end of a string, if it exists.
 *
 * @tsplus static fncts.StringOps unappend
 * @tsplus pipeable fncts.String unappend
 */
export function unappend(x: string) {
  return (s: string): string => {
    return s.endsWith(x) ? s.substring(0, s.lastIndexOf(x)) : s;
  };
}

/**
 * Remove the start and end of a string, if they both exist.
 *
 * @tsplus static fncts.StringOps unsurround
 * @tsplus pipeable fncts.String unsurround
 */
export function unsurround(x: string) {
  return (s: string): string => {
    return s.startsWith(x) && s.endsWith(x) ? s.unprepend(x).unappend(x) : s;
  };
}

/**
 * Apply an endomorphism upon an array of characters against a string.
 * This is useful as it allows you to run many polymorphic functions targeting
 * arrays against strings without having to rewrite them.
 *
 * @tsplus static fncts.StringOps under
 * @tsplus pipeable fncts.String under
 */
export function under(f: (chars: Array<string>) => Array<string>) {
  return (s: string): string => {
    return f(s.split("")).join("");
  };
}

/**
 * Join newline-separated strings together.
 *
 * @tsplus getter fncts.ReadonlyArray unlines
 */
export function unlines(as: ReadonlyArray<string>): string {
  return as.join("\n");
}
