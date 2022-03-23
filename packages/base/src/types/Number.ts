export type IsInt<N extends number> = N & (`${N}` extends `${bigint}` ? N : never);
