import { ServiceNotFoundError } from "@fncts/base/data/Environment/ServiceNotFoundError";

/**
 * @tsplus pipeable fncts.Environment add
 */
export function add<S extends Value, Id = S, Value = Id>(
  service: S,
  tag: Tag<Id, Value>,
): <R>(self: Environment<R>) => Environment<R | Id>;
export function add<S extends Value, Id = S, Value = Id>(service: S, tag: Tag<Id, Value>) {
  return <R>(self: Environment<R>): Environment<R | Id> => {
    return new Environment(self.map.set(tag, service));
  };
}

/**
 * @tsplus static fncts.EnvironmentOps empty
 */
export const empty = Environment();

type Tags<R> = R extends infer Id ? Tag<Id, any> : never;

/**
 * @tsplus pipeable fncts.Environment get
 */
export function get<R, T extends Tags<R>>(tag: T) {
  return (self: Environment<R>): Tag.Id<T> => {
    return unsafeCoerce(self.unsafeGet(tag));
  };
}

/**
 * @tsplus pipeable fncts.Environment getMaybe
 */
export function getMaybe<Id, Value>(tag: Tag<Id, Value>) {
  return <R>(self: Environment<R>): Maybe<Value> => {
    return self.cache.get(tag) as Maybe<Value>;
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
  return <R>(self: Environment<R>): Environment<R | R1> => {
    return new Environment(self.map.union(that.map));
  };
}

/**
 * @tsplus pipeable fncts.Environment unsafeGet
 */
export function unsafeGet<Id, Value>(tag: Tag<Id, Value>) {
  return <R>(self: Environment<R>): Value => {
    return self.cache.get(tag).match(
      () => {
        const iterator     = self.map[Symbol.iterator]();
        let service: Value = null!;
        let r: IteratorResult<readonly [Tag<unknown>, unknown]>;
        while (!(r = iterator.next()).done) {
          const [curTag, curService] = r.value;
          if (curTag.id === tag.id) {
            service = curService as Value;
          }
        }
        if (service === null) throw new ServiceNotFoundError(tag);
        else {
          self.cache = self.cache.set(tag, service);
          return service;
        }
      },
      (a) => a as Value,
    );
  };
}

/**
 * @tsplus pipeable fncts.Environment update
 */
export function update<R, Id extends R, Value>(f: (s: Value) => Value, tag: Tag<Id, Value>) {
  return (self: Environment<R>): Environment<R> => {
    return self.add(f(self.unsafeGet(tag)), tag);
  };
}
