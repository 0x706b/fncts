import type { _A, _R } from "@fncts/base/types";

import { Gen } from "../definition.js";

export function struct<P extends Record<string, Gen<any, any>>>(
  properties: P,
): Gen<_R<P[keyof P]>, { readonly [K in keyof P]: _A<P[K]> }> {
  const entries = Object.entries(properties);
  return entries.foldLeft(Gen.constant({}) as Gen<any, any>, (b, [k, gen]) =>
    b.zipWith(gen, (out, a) => ({ ...out, [k]: a })),
  );
}

export function partial<P extends Record<string, Gen<any, any>>>(
  properties: P,
): Gen<Has<Random> & _R<P[keyof P]>, Partial<{ readonly [K in keyof P]: _A<P[K]> }>> {
  const entries = Object.entries(properties);
  return entries.foldLeft(Gen.constant({}) as Gen<any, any>, (b, [k, gen]) =>
    Gen.unwrap(Random.nextBoolean.ifIO(IO.succeed(b.zipWith(gen, (r, a) => ({ ...r, [k]: a }))), IO.succeed(b))),
  );
}
