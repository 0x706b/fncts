import type { DecodeError } from "@fncts/base/data/DecodeError";

export const DecoderTypeId = Symbol.for("fncts.Decoder");
export type DecoderTypeId = typeof DecoderTypeId;

export interface DecoderF extends Decoder<any> {}

/**
 * @tsplus type fncts.Decoder
 * @tsplus companion fncts.DecoderOps
 */
export class Decoder<A> {
  readonly _typeId: DecoderTypeId = DecoderTypeId;
  readonly [HKT.F]!: DecoderF;
  readonly [HKT.A]!: () => A;
  readonly [HKT.T]!: Decoder<HKT._A<this>>;
  constructor(readonly decode: (input: unknown) => These<DecodeError, A>, readonly label: string) {}
}

/**
 * @tsplus static fncts.DecoderOps __call
 */
export function makeDecoder<A>(decode: (input: unknown) => These<DecodeError, A>, label: string): Decoder<A> {
  return new Decoder(decode, label);
}
