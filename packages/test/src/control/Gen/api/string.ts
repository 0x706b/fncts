import type { Sized } from "../../Sized.js";
import type { LengthConstraints } from "../constraints.js";

import { Gen } from "../definition.js";
import { alphaNumericChar, asciiChar, base64Char, char16, fullUnicodeChar, hexChar, unicodeChar } from "./char.js";

/**
 * @tsplus static fncts.test.GenOps asciiString
 */
export function asciiString<R>(constraints?: LengthConstraints): Gen<R | Sized, string> {
  return asciiChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps alphaNumericString
 */
export function alphaNumericString(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return alphaNumericChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps base64String
 */
export function base64String(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return base64Char.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps fullUnicodeString
 */
export function fullUnicodeString(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return fullUnicodeChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps hexString
 */
export function hexString(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return hexChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps string16
 */
export function string16(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return char16.string(constraints);
}

/**
 * @tsplus pipeable fncts.test.Gen string
 */
export function string(constraints: LengthConstraints = {}) {
  return <R>(char: Gen<R, string>): Gen<R | Sized, string> => {
    const min = constraints.minLength || 0;
    return constraints.maxLength
      ? Gen.bounded(min, constraints.maxLength, (n) => char.stringN(n))
      : Gen.small((n) => char.stringN(n), min);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen stringN
 */
export function stringN(n: number) {
  return <R>(char: Gen<R, string>): Gen<R, string> => {
    return char.arrayN(n).map((arr) => arr.join(""));
  };
}

/**
 * @tsplus static fncts.test.GenOps unicodeString
 */
export function unicodeString(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return unicodeChar.string(constraints);
}
