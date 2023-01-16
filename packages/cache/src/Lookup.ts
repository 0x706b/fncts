/**
 * A `Lookup` represents a lookup function that, given a key of type `Key`, can
 * return a `IO` effect that will either produce a value of type `Value` or
 * fail with an error of type `Error` using an environment of type
 * `Environment`.
 *
 * You can think of a `Lookup` as an effectual function that computes a value
 * given a key. Given any effectual function you can convert it to a lookup
 * function for a cache by using the `Lookup` constructor.
 */
export type Lookup<Key, Environment, Error, Value> = (key: Key) => IO<Environment, Error, Value>;

/**
 * Like lookup but scoped version
 */
export type ScopedLookup<Key, Environment, Error, Value> = (key: Key) => IO<Environment | Scope, Error, Value>;
