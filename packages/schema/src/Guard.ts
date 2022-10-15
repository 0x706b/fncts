import type { GuardF } from "@fncts/base/data/Guard";
import type { Schemable as S } from "@fncts/schema/Schemable";

export const Schemable: S<GuardF> = {
  unknown: Guard.unknown,
  string: Derive(),
  number: Derive(),
  boolean: Derive(),
  bigint: Derive(),
  literal: Guard.literal,
  nullable: Guard.nullable,
  struct: Guard.struct,
  partial: Guard.partial,
  array: Guard.readonlyArray,
  record: Guard.record,
  tuple: unsafeCoerce(Guard.tuple),
  lazy: Guard.lazy,
  validation: unsafeCoerce(Guard.validation),
  union: (members) => Guard.union(...members),
};
