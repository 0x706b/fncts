import type { DecoderF } from "@fncts/base/data/Decoder";
import type { Schemable as S } from "@fncts/schema/Schemable";

export const Schemable: S<DecoderF> = {
  unknown: Decoder.unknown,
  string: Derive(),
  number: Derive(),
  boolean: Derive(),
  bigint: Derive(),
  literal: Decoder.literal,
  nullable: Decoder.nullable,
  struct: Decoder.struct,
  partial: Decoder.partial,
  array: Decoder.readonlyArray,
  record: Decoder.record,
  tuple: unsafeCoerce(Decoder.tuple),
  lazy: Decoder.lazy,
  validation: unsafeCoerce(Decoder.validation),
  union: (members) => Decoder.union(...members),
};
