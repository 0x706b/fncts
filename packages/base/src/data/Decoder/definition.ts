import type { DecodeError } from "@fncts/base/data/DecodeError";

export const DecoderTypeId = Symbol.for("fncts.Decoder");
export type DecoderTypeId = typeof DecoderTypeId;

export interface DecoderF extends HKT {
  type: Decoder<this["A"]>;
  variance: {
    A: "+";
  };
}

/**
 * @tsplus type fncts.Decoder
 * @tsplus companion fncts.DecoderOps
 * @tsplus derive nominal
 */
export class Decoder<in out A> {
  readonly [DecoderTypeId]: DecoderTypeId = DecoderTypeId;
  constructor(
    readonly decode: (input: unknown) => These<DecodeError, A>,
    readonly label: string,
  ) {}
}

/**
 * @tsplus static fncts.DecoderOps __call
 */
export function makeDecoder<A>(decode: (input: unknown) => These<DecodeError, A>, label: string): Decoder<A> {
  return new Decoder(decode, label);
}
