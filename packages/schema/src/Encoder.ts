import type { EncoderF } from "@fncts/base/data/Encoder";
import type { Schemable as S } from "@fncts/schema/Schemable";

import { interpret } from "@fncts/schema/Schema";

import * as G from "./Guard.js";

export const Schemable: S<EncoderF> = {
  unknown: Encoder.unknown,
  string: Derive(),
  number: Derive(),
  boolean: Derive(),
  bigint: Derive(),
  literal: Encoder.literal,
  nullable: Encoder.nullable,
  struct: Encoder.struct,
  partial: Encoder.partial,
  array: Encoder.readonlyArray,
  record: Encoder.record,
  tuple: unsafeCoerce(Encoder.tuple),
  lazy: Encoder.lazy,
  validation: unsafeCoerce(Encoder.validation),
  union: (members, schema) => {
    const guards = schema.members.map(interpret(G.Schemable));
    return Encoder((inp) => {
      let encoder: Encoder<any> | undefined;
      for (let i = 0; i < guards.length; i++) {
        if (guards[i]!.is(inp)) {
          encoder = members[i]!;
        }
      }
      if (!encoder) {
        throw new Error("BUG: Encoder not found for union");
      }
      return encoder.encode(inp);
    });
  },
};
