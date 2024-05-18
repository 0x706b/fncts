export interface NothingJson {
  readonly _tag: "Nothing";
}

export interface JustJson<A> {
  readonly _tag: "Just";
  readonly value: A;
}

/**
 * @tsplus type fncts.MaybeJson
 */
export type MaybeJson<A> = NothingJson | JustJson<A>;

/**
 * @tsplus type fncts.MaybeJsonOps
 */
export interface MaybeJsonOps {}

export const MaybeJson: MaybeJsonOps = {};
