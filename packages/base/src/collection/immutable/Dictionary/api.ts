/**
 * @tsplus pipeable fncts.Dictionary foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Dictionary<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.Dictionary foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (k: string, b: B, a: A) => B) {
  return (self: Dictionary<A>): B => {
    let out   = b;
    const ks  = self.keys;
    const len = ks.length;
    for (let i = 0; i < len; i++) {
      const k = ks[i]!;
      out     = f(k, out, self.toRecord[k]!);
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.Dictionary get
 */
export function get(key: string) {
  return <A>(self: Dictionary<A>): Maybe<A> => {
    return Maybe.fromNullable(self.unsafeGet(key));
  };
}

/**
 * @tsplus pipeable fncts.Dictionary set
 */
export function set<A>(key: string, value: A) {
  return (self: Dictionary<A>): Dictionary<A> => {
    return Dictionary({ ...self.toRecord, [key]: value });
  };
}

/**
 * @tsplus pipeable fncts.Dictionary remove
 */
export function remove(key: string) {
  return <A>(self: Dictionary<A>): Dictionary<A> => {
    const out = { ...self.toRecord };
    delete out[key];
    return Dictionary(out);
  };
}

/**
 * @tsplus pipeable fncts.Dictionary update
 */
export function update<A>(key: string, f: (a: Maybe<A>) => Maybe<A>) {
  return (self: Dictionary<A>): Dictionary<A> => {
    return f(self.get(key)).match(
      () => self.remove(key),
      (a) => self.set(key, a),
    );
  };
}

/**
 * @tsplus getter fncts.Dictionary keys
 */
export function keys<A>(self: Dictionary<A>): ReadonlyArray<string> {
  return unsafeCoerce(Object.keys(self.toRecord));
}

/**
 * @tsplus pipeable fncts.Dictionary map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Dictionary<A>): Dictionary<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.Dictionary mapWithIndex
 */
export function mapWithIndex<A, B>(f: (k: string, a: A) => B) {
  return (self: Dictionary<A>): Dictionary<B> => {
    const out = {} as Record<string, B>;
    const ks  = self.keys;
    const len = ks.length;
    for (let i = 0; i < len; i++) {
      const k = ks[i]!;
      out[k]  = f(k, self.toRecord[k]!);
    }
    return Dictionary.get(out);
  };
}

/**
 * @tsplus static fncts.DictionaryOps __call
 * @tsplus macro identity
 */
export function fromRecord<A>(self: Record<string, A>): Dictionary<A> {
  return Dictionary.get(self);
}

/**
 * @tsplus getter fncts.Dictionary toRecord
 * @tsplus macro identity
 */
export function toRecord<A>(self: Dictionary<A>): Record<string, A> {
  return Dictionary.reverseGet(self);
}

/**
 * @tsplus pipeable fncts.Dictionary unsafeGet
 */
export function unsafeGet(key: string) {
  return <A>(self: Dictionary<A>): A | undefined => {
    return self.toRecord[key];
  };
}
