import { Conc } from "../../../collection/immutable/Conc";
import { Either } from "../../../data/Either";
import { tuple } from "../../../data/function";

export function zipChunks<A, B, C>(fa: Conc<A>, fb: Conc<B>, f: (a: A, b: B) => C): readonly [Conc<C>, Either<Conc<A>, Conc<B>>] {
  let fc    = Conc.empty<C>();
  const len = Math.min(fa.length, fb.length);
  for (let i = 0; i < len; i++) {
    fc = fc.append(f(fa.unsafeGet(i), fb.unsafeGet(i)));
  }

  if (fa.length > fb.length) {
    return tuple(fc, Either.left(fa.drop(fb.length)));
  }

  return tuple(fc, Either.right(fb.drop(fa.length)));
}
