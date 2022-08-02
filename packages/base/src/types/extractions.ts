export type ExtractContravariantPhantom<A, P extends PropertyKey> = [A] extends [{ [K in P]: (_: infer T) => void }]
  ? T
  : never;
export type ExtractCovariantPhantom<A, P extends PropertyKey> = [A] extends [{ [K in P]: () => infer T }] ? T : never;

export type _W<A> = ExtractCovariantPhantom<A, "_W">;
export type _S1<A> = ExtractContravariantPhantom<A, "_S1">;
export type _S2<A> = ExtractCovariantPhantom<A, "_S2">;
export type _R<A> = ExtractCovariantPhantom<A, "_R">;
export type _E<A> = ExtractCovariantPhantom<A, "_E">;
export type _A<A> = ExtractCovariantPhantom<A, "_A">;
