/**
 * @tsplus pipeable fncts.Environment add
 */
export function add<H extends S, S = H>(service: H, tag: Tag<S>) {
  return <R>(self: Environment<R>): Environment<R | S> => {
    return new Environment(self.map.set(tag, service));
  };
}

/**
 * @tsplus static fncts.EnvironmentOps empty
 */
export const empty = Environment();

type Tags<R> = R extends infer S ? Tag<S> : never;

/**
 * @tsplus pipeable fncts.Environment get
 */
export function get<R, T extends Tags<R>>(tag: T) {
  return (self: Environment<R>): T extends Tag<infer S> ? S : never => {
    return unsafeCoerce(self.unsafeGet(tag));
  };
}

/**
 * @tsplus pipeable fncts.Environment getMaybe
 */
export function getMaybe<S>(tag: Tag<S>) {
  return <R extends Has<S>>(self: Environment<R>): Maybe<S> => {
    return self.cache.get(tag) as Maybe<S>;
  };
}

/**
 * @tsplus static fncts.EnvironmentOps __call
 */
export function make(): Environment<never> {
  return new Environment(HashMap.empty(), HashMap.empty());
}

/**
 * @tsplus pipeable-operator fncts.Environment +
 * @tsplus pipeable fncts.Environment union
 */
export function union<R1>(that: Environment<R1>) {
  return <R>(self: Environment<R>): Environment<R & R1> => {
    return new Environment(self.map.union(that.map));
  };
}

/**
 * @tsplus getter fncts.Environment clean
 */
export function clean<R>(self: Environment<R>): Environment<R> {
  const [map, index] = self.map.toList.foldLeft(
    [HashMap.empty<Tag<unknown>, readonly [unknown, number]>(), 0],
    ([map, index], [tag, service]) => [map.set(tag, [service, index] as const), index + 1],
  );
  return new Environment(map);
}

/**
 * @tsplus pipeable fncts.Environment unsafeGet
 */
export function unsafeGet<S>(tag: Tag<S>) {
  return <R>(self: Environment<R>): S => {
    return self.cache.get(tag).match(
      () => {
        const iterator = self.map[Symbol.iterator]();
        let service: S = null!;
        let r: IteratorResult<readonly [Tag<unknown>, unknown]>;
        while (!(r = iterator.next()).done) {
          const [curTag, curService] = r.value;
          if (curTag == tag) {
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
  };
}

/**
 * @tsplus pipeable fncts.Environment update
 */
export function update<R, S extends R>(f: (s: S) => S, tag: Tag<S>) {
  return (self: Environment<R>): Environment<R> => {
    return self.add(f(self.unsafeGet(tag)), tag);
  };
}
