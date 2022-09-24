export const EncoderTypeId = Symbol.for("fncts.Encoder");
export type EncoderTypeId = typeof EncoderTypeId;

/**
 * @tsplus type fncts.Encoder
 * @tsplus companion fncts.EncoderOps
 * @tsplus derive nominal
 */
export class Encoder<in out A> {
  readonly _typeId: EncoderTypeId = EncoderTypeId;
  constructor(readonly encode: (inp: A) => unknown) {}
}
