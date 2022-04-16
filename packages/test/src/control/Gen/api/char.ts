import type { NumberConstraints } from "../constraints.js";

import { identity } from "@fncts/base/data/function";

import { Gen } from "../definition.js";

const gapSize = 0xdfff + 1 - 0xd800;

/**
 * @tsplus static fncts.test.GenOps alphaNumericChar
 */
export const alphaNumericChar: Gen<Has<Random>, string> = Gen.weighted(
  [Gen.char({ min: 48, max: 57 }), 10],
  [Gen.char({ min: 65, max: 90 }), 26],
  [Gen.char({ min: 97, max: 122 }), 26],
);

/**
 * @tsplus static fncts.test.GenOps asciiChar
 */
export const asciiChar: Gen<Has<Random>, string> = _char(0x00, 0x7f, indexToPrintableIndex);

/**
 * @tsplus static fncts.test.GenOps base64Char
 */
export const base64Char: Gen<Has<Random>, string> = _char(0, 63, base64ToCharCode);

/**
 * @tsplus static fncts.test.GenOps char
 */
export function char(constraints: Required<NumberConstraints>): Gen<Has<Random>, string> {
  return _char(constraints.min, constraints.max, identity);
}

/**
 * @tsplus static fncts.test.GenOps char16
 */
export const char16: Gen<Has<Random>, string> = _char(0x0000, 0xffff, indexToPrintableIndex);

/**
 * @tsplus static fncts.test.GenOps fullUnicodeChar
 */
export const fullUnicodeChar: Gen<Has<Random>, string> = _char(0x0000, 0x10ffff - gapSize, unicodeToCharCode);

/**
 * @tsplus static fncts.test.GenOps hexChar
 */
export const hexChar: Gen<Has<Random>, string> = _char(0, 15, hexToCharCode);

/**
 * @tsplus static fncts.test.GenOps printableChar
 */
export const printableChar: Gen<Has<Random>, string> = char({ min: 0x20, max: 0x7e });

/**
 * @tsplus static fncts.test.GenOps unicodeChar
 */
export const unicodeChar: Gen<Has<Random>, string> = _char(0x0000, 0xffff - gapSize, unicodeToCharCode);

function _char(min: number, max: number, mapToCode: (v: number) => number): Gen<Has<Random>, string> {
  return Gen.int({ min, max }).map((n) => String.fromCharCode(mapToCode(n)));
}

function indexToPrintableIndex(v: number): number {
  return v < 95 ? v + 0x20 : v <= 0x7e ? v - 95 : v;
}

function base64ToCharCode(v: number): number {
  if (v < 26) return v + 65; // A-Z
  if (v < 52) return v + 97 - 26; // a-z
  if (v < 62) return v + 48 - 52; // 0-9
  return v === 62 ? 43 : 47; // +/
}

function hexToCharCode(v: number): number {
  return v < 10
    ? v + 48 // 0-9
    : v + 97 - 10; // a-f
}

function unicodeToCharCode(v: number): number {
  return v < 0xd800 ? indexToPrintableIndex(v) : v + gapSize;
}
