export type _R<A> = [A] extends [{ _R: (_: infer R) => void }] ? R : never;
export type _E<A> = [A] extends [{ _E: () => infer E }] ? E : never;
export type _A<A> = [A] extends [{ _A: () => infer A }] ? A : never;
