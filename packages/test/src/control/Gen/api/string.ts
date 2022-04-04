import type { Sized } from "../../Sized.js";
import type { LengthConstraints } from "../constraints.js";

import { Gen } from "../definition.js";
import {
  alphaNumericChar,
  asciiChar,
  base64Char,
  char16,
  fullUnicodeChar,
  hexChar,
  unicodeChar,
} from "./char.js";

/**
 * @tsplus static fncts.test.control.GenOps asciiString
 */
export function asciiString<R>(
  constraints?: LengthConstraints,
): Gen<R & Has<Random> & Has<Sized>, string> {
  return asciiChar.string(constraints);
}

/**
 * @tsplus static fncts.test.control.GenOps alphaNumericString
 */
export function alphaNumericString(
  constraints: LengthConstraints = {},
): Gen<Has<Random> & Has<Sized>, string> {
  return alphaNumericChar.string(constraints);
}

/**
 * @tsplus static fncts.test.control.GenOps base64String
 */
export function base64String(
  constraints: LengthConstraints = {},
): Gen<Has<Random> & Has<Sized>, string> {
  return base64Char.string(constraints);
}

/**
 * @tsplus static fncts.test.control.GenOps fullUnicodeString
 */
export function fullUnicodeString(
  constraints: LengthConstraints = {},
): Gen<Has<Random> & Has<Sized>, string> {
  return fullUnicodeChar.string(constraints);
}

/**
 * @tsplus static fncts.test.control.GenOps hexString
 */
export function hexString(
  constraints: LengthConstraints = {},
): Gen<Has<Random> & Has<Sized>, string> {
  return hexChar.string(constraints);
}

/**
 * @tsplus static fncts.test.control.GenOps string16
 */
export function string16(
  constraints: LengthConstraints = {},
): Gen<Has<Random> & Has<Sized>, string> {
  return char16.string(constraints);
}

/**
 * @tsplus fluent fncts.test.control.Gen string
 */
export function string<R>(
  char: Gen<R, string>,
  constraints: LengthConstraints = {},
): Gen<R & Has<Random> & Has<Sized>, string> {
  const min = constraints.minLength || 0;
  return constraints.maxLength
    ? Gen.bounded(min, constraints.maxLength, (n) => char.stringN(n))
    : Gen.small((n) => char.stringN(n), min);
}

/**
 * @tsplus fluent fncts.test.control.Gen stringN
 */
export function stringN<R>(char: Gen<R, string>, n: number): Gen<R, string> {
  return char.arrayN(n).map((arr) => arr.join(""));
}

/**
 * @tsplus static fncts.test.control.GenOps unicodeString
 */
export function unicodeString(
  constraints: LengthConstraints = {},
): Gen<Has<Random> & Has<Sized>, string> {
  return unicodeChar.string(constraints);
}
