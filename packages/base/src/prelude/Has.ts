export declare const HasTypeId: unique symbol;
export type HasTypeId = typeof HasTypeId;

/**
 * @tsplus type fncts.prelude.Has
 */
export interface Has<T> {
  [HasTypeId]: {
    _T: () => T;
  };
}

/**
 * @tsplus operator fncts.prelude.Has &
 * @tsplus fluent fncts.prelude.Has merge
 */
export function merge<A extends Has<any>, B extends Has<any>>(self: A, that: B): A & B {
  return { ...self, ...that };
}
