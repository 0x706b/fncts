/**
 * @tsplus fluent fncts.Environment add
 */
export function add<R, H extends S, S = H>(self: Environment<R>, service: H, tag: Tag<S>): Environment<R | S> {
  const self0 = self.index === Number.MAX_SAFE_INTEGER ? self.clean : self;
  return new Environment(self0.map.set(tag, [service, self0.index]), self0.index + 1);
}

/**
 * @tsplus static fncts.EnvironmentOps empty
 */
export const empty = Environment();

type Tags<R> = R extends infer S ? Tag<S> : never;

/**
 * @tsplus fluent fncts.Environment get
 */
export function get<R, T extends Tags<R>>(self: Environment<R>, tag: T): T extends Tag<infer S> ? S : never {
  return unsafeCoerce(self.unsafeGet(tag));
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
export function make(): Environment<never> {
  return new Environment(HashMap.makeDefault(), 0, HashMap.makeDefault());
}

/**
 * @tsplus operator fncts.Environment +
 * @tsplus fluent fncts.Environment union
 */
export function union<R, R1>(self: Environment<R>, that: Environment<R1>): Environment<R & R1> {
  const [self0, that0] = self.index + that.index < self.index ? [self.clean, that.clean] : [self, that];
  return new Environment(
    self0.map.union(that0.map.map(([service, index]) => [service, self0.index + index] as const)),
    self0.index + that0.index,
  );
}

/**
 * @tsplus getter fncts.Environment clean
 */
export function clean<R>(self: Environment<R>): Environment<R> {
  const [map, index] = self.map.toList
    .sort(Number.Ord.contramap(([, [, idx]]) => idx))
    .foldLeft(
      [HashMap.makeDefault<Tag<unknown>, readonly [unknown, number]>(), 0],
      ([map, index], [tag, [service]]) => [map.set(tag, [service, index] as const), index + 1],
    );

  return new Environment(map, index);
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
}

/**
 * @tsplus fluent fncts.Environment update
 */
export function update<R, S extends R>(self: Environment<R>, f: (s: S) => S, tag: Tag<S>): Environment<R> {
  return self.add(f(self.unsafeGet(tag)), tag);
}
