/**
 * @tsplus fluent fncts.Environment add
 */
export function add<R, S, H extends S = S>(self: Environment<R>, service: H, tag: Tag<S>): Environment<R & Has<S>> {
  return new Environment(self.cache.set(tag, service));
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
  return new Environment(HashMap.makeDefault());
}

/**
 * @tsplus operator fncts.Environment +
 * @tsplus fluent fncts.Environment union
 */
export function union<R, R1>(self: Environment<R>, that: Environment<R1>): Environment<R & R1> {
  return new Environment(self.cache.union(that.cache));
}

/**
 * @tsplus fluent fncts.Environment unsafeGet
 */
export function unsafeGet<R, S>(self: Environment<R>, tag: Tag<S>): S {
  return self.cache.unsafeGet(tag) as S;
}

/**
 * @tsplus fluent fncts.Environment update
 */
export function update<R extends Has<S>, S>(self: Environment<R>, f: (s: S) => S, tag: Tag<S>): Environment<R> {
  return self.add(f(self.get(tag)), tag);
}
