export interface RightJson<A> {
  readonly _tag: "Right";
  readonly right: A;
}

export interface LeftJson<E> {
  readonly _tag: "Left";
  readonly left: E;
}

/**
 * @tsplus type fncts.EitherJson
 */
export type EitherJson<E, A> = LeftJson<E> | RightJson<A>;

/**
 * @tsplus type fncts.EitherJsonOps
 */
export interface EitherJsonOps {}

export const EitherJson: EitherJsonOps = {};

/**
 * @tsplus static fncts.EitherJsonOps getDecoder
 */
export function getDecoder<E, A>(left: Decoder<E>, right: Decoder<A>): Decoder<EitherJson<E, A>> {
  return Derive();
}
