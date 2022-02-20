export type Erase<A, B> = A & B extends B & infer C ? C : A;
