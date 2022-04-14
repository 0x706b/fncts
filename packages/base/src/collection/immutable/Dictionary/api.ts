/**
 * @tsplus fluent fncts.Dictionary foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(
  self: Dictionary<A>,
  b: B,
  f: (k: string, b: B, a: A) => B,
): B {
  let out   = b;
  const ks  = self.keys;
  const len = ks.length;
  for (let i = 0; i < len; i++) {
    const k = ks[i]!;
    out     = f(k, out, self.toRecord[k]!);
  }
  return out;
}

/**
 * @tsplus getter fncts.Dictionary keys
 */
export function keys<A>(self: Dictionary<A>): ReadonlyArray<string> {
  return unsafeCoerce(Object.keys(self.toRecord));
}

/**
 * @tsplus fluent fncts.Dictionary map
 */
export function map_<A, B>(self: Dictionary<A>, f: (a: A) => B): Dictionary<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Dictionary mapWithIndex
 */
export function mapWithIndex_<A, B>(self: Dictionary<A>, f: (k: string, a: A) => B): Dictionary<B> {
  const out = {} as Record<string, B>;
  const ks  = self.keys;
  const len = ks.length;
  for (let i = 0; i < len; i++) {
    const k = ks[i]!;
    out[k]  = f(k, self.toRecord[k]!);
  }
  return Dictionary.get(out);
}

/**
 * @tsplus getter fncts.Dictionary toRecord
 * @tsplus macro identity
 */
export function toRecord<A>(self: Dictionary<A>): Record<string, A> {
  return Dictionary.reverseGet(self);
}
