export declare const HasTypeId: unique symbol;
export type HasTypeId = typeof HasTypeId;

/**
 * @tsplus type fncts.Has
 */
export interface Has<T> {
  [HasTypeId]: {
    _T: () => T;
  };
}

/**
 * @tsplus pipeable-operator fncts.Has &
 * @tsplus pipeable fncts.Has merge
 */
export function merge<B extends Has<any>>(that: B) {
  return <A extends Has<any>>(self: A): A & B => {
    return { ...self, ...that };
  };
}
