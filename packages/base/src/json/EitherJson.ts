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
