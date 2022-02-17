export type _A<A> = [A] extends [{ _A: () => infer A }] ? A : never;
