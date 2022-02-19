export declare const HasTypeId: unique symbol;
export type HasTypeId = typeof HasTypeId;

export interface Has<T> {
  [HasTypeId]: {
    _T: () => T;
  };
}
