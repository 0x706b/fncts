export type Primitive = string | number | boolean | null | symbol;
export type Constructor<A> = {
  new (...args: any[]): A;
};
export type Nullable<A> = A | null | undefined;
export type IsInt<N extends number> = N & (`${N}` extends `${bigint}` ? N : never);
export interface Spreadable extends Record<PropertyKey, any> {}
