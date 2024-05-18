export interface LeftJson<E> {
  readonly _tag: "Left";
  readonly left: E;
}

export interface RightJson<A> {
  readonly _tag: "Right";
  readonly right: A;
}

export interface BothJson<E, A> {
  readonly _tag: "Both";
  readonly left: E;
  readonly right: A;
}

export type TheseJson<E, A> = LeftJson<E> | RightJson<A> | BothJson<E, A>;

/**
 * @tsplus type fncts.TheseJsonOps
 */
export interface TheseJsonOps {}

export const TheseJson: TheseJsonOps = {};
