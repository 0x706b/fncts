/**
 * @tsplus fluent fncts.Environment add
 */
export function add<R, S, H extends S = S>(self: Environment<R>, service: H, tag: Tag<S>): Environment<R & Has<S>> {
  return new Environment(self.map.set(tag, [service, self.index]), self.index + 1);
}

/**
 * @tsplus static fncts.EnvironmentOps empty
 */
export const empty = Environment();

/**
 * @tsplus fluent fncts.Environment get
 */
export function get<R extends Has<S>, S>(self: Environment<R>, tag: Tag<S>): S {
  return self.unsafeGet(tag);
}

/**
 * @tsplus fluent fncts.Environment getMaybe
 */
export function getMaybe<R extends Has<S>, S>(self: Environment<R>, tag: Tag<S>): Maybe<S> {
  return self.cache.get(tag) as Maybe<S>;
}

/**
 * @tsplus static fncts.EnvironmentOps __call
 */
export function make(): Environment<unknown> {
  return new Environment(HashMap.makeDefault(), 0, HashMap.makeDefault());
}

/**
 * @tsplus operator fncts.Environment +
 * @tsplus fluent fncts.Environment union
 */
export function union<R, R1>(self: Environment<R>, that: Environment<R1>): Environment<R & R1> {
  return new Environment(
    self.map.union(that.map.map(([service, index]) => [service, self.index + index] as const)),
    self.index + that.index,
  );
}

/**
 * @tsplus fluent fncts.Environment unsafeGet
 */
export function unsafeGet<R, S>(self: Environment<R>, tag: Tag<S>): S {
  return self.cache.get(tag).match(
    () => {
      let index      = -1;
      const iterator = self.map[Symbol.iterator]();
      let service: S = null!;
      let r: IteratorResult<readonly [Tag<unknown>, readonly [unknown, number]]>;
      while (!(r = iterator.next()).done) {
        const [curTag, [curService, curIndex]] = r.value;
        if (curTag == tag && curIndex > index) {
          index   = curIndex;
          service = curService as S;
        }
      }
      if (service === null) throw new Error("Defect in Environment: Could not find tag in map");
      else {
        self.cache = self.cache.set(tag, service);
        return service;
      }
    },
    (a) => a as S,
  );
  // return self.cache.unsafeGet(tag) as S;
}

/**
 * @tsplus fluent fncts.Environment update
 */
export function update<R extends Has<S>, S>(self: Environment<R>, f: (s: S) => S, tag: Tag<S>): Environment<R> {
  return self.add(f(self.get(tag)), tag);
}
