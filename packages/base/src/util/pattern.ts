export const pattern_: <N extends string>(
  n: N
) => {
  <
    X extends { [k in N]: string },
    K extends { [k in X[N]]: (_: Extract<X, { [_tag in N]: k }>) => any }
  >(
    m: X,
    _: K
  ): ReturnType<K[keyof K]>;
  <
    X extends { [k in N]: string },
    K extends { [k in X[N]]?: (_: Extract<X, { [_tag in N]: k }>) => any },
    H
  >(
    m: X,
    _: K,
    __: (_: Exclude<X, { _tag: keyof K }>) => H
  ): { [k in keyof K]: ReturnType<NonNullable<K[k]>> }[keyof K] | H;
} = (n) =>
  ((m: any, _: any, d: any) => {
    return (_[m[n]] ? _[m[n]](m) : d(m)) as any;
  }) as any;

export const pattern: <N extends string>(
  n: N
) => {
  <
    X extends { [k in N]: string },
    K extends { [k in X[N]]: (_: Extract<X, { [_tag in N]: k }>) => any }
  >(
    _: K
  ): (m: X) => ReturnType<K[keyof K]>;
  <
    X extends { [k in N]: string },
    K extends { [k in X[N]]?: (_: Extract<X, { [_tag in N]: k }>) => any },
    H
  >(
    _: K,
    __: (_: Exclude<X, { _tag: keyof K }>) => H
  ): (m: X) => { [k in keyof K]: ReturnType<NonNullable<K[k]>> }[keyof K] | H;
} = (n) =>
  ((_: any, d: any) => (m: any) => {
    return (_[m[n]] ? _[m[n]](m) : d(m)) as any;
  }) as any;

export const matchTag_ = pattern_("_tag");

export const matchTag = pattern("_tag");
