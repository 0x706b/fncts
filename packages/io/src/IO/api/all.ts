import type { _A, _E, _R } from "@fncts/base/types";
import type { EnvironmentOf, ErrorOf, IOVariance, ValueOf } from "@fncts/io/IO";

/**
 * @tsplus static fncts.io.IOOps all
 */
export function all<T extends ReadonlyArray<IO<any, any, any>>>(
  ios: [...T],
): IO<
  { [K in number]: EnvironmentOf<T[K]> }[number],
  { [K in number]: ErrorOf<T[K]> }[number],
  { [K in keyof T]: ValueOf<T[K]> }
>;
export function all<T extends Iterable<IO<any, any, any>>>(
  ios: T,
): [T] extends [Iterable<infer A>] ? IO<EnvironmentOf<A>, ErrorOf<A>, Conc<ValueOf<A>>> : never;
export function all<T extends Record<string, IO<any, any, any>>>(
  ios: T,
): IO<
  { [K in keyof T]: EnvironmentOf<T[K]> }[keyof T],
  { [K in keyof T]: ErrorOf<T[K]> }[keyof T],
  { [K in keyof T]: ValueOf<T[K]> }
>;
export function all(ios: Record<string, IO<any, any, any>> | Iterable<IO<any, any, any>>): IO<any, any, any> {
  if (Symbol.iterator in ios) {
    return IO.foreach(ios, Function.identity);
  } else {
    return IO.foreach(
      Object.entries(ios).map(([k, io]) => io.map((value) => [k, value] as const)),
      Function.identity,
    ).map((result) => result.foldLeft({} as Record<string, any>, (b, a) => Object.assign(b, { [a[0]]: a[1] })));
  }
}

/**
 * @tsplus static fncts.io.IOOps allConcurrent
 */
export function allConcurrent<T extends ReadonlyArray<IO<any, any, any>>>(
  ios: [...T],
): IO<
  { [K in number]: EnvironmentOf<T[K]> }[number],
  { [K in number]: ErrorOf<T[K]> }[number],
  { [K in keyof T]: ValueOf<T[K]> }
>;
export function allConcurrent<T extends Iterable<IO<any, any, any>>>(
  ios: T,
): [T] extends [Iterable<infer A>] ? IO<EnvironmentOf<A>, ErrorOf<A>, Conc<ValueOf<A>>> : never;
export function allConcurrent<T extends Record<string, IO<any, any, any>>>(
  ios: T,
): IO<
  { [K in keyof T]: EnvironmentOf<T[K]> }[keyof T],
  { [K in keyof T]: ErrorOf<T[K]> }[keyof T],
  { [K in keyof T]: ValueOf<T[K]> }
>;
export function allConcurrent(ios: Record<string, IO<any, any, any>> | Iterable<IO<any, any, any>>): IO<any, any, any> {
  if (Symbol.iterator in ios) {
    return IO.foreachConcurrent(ios, Function.identity);
  } else {
    return IO.foreachConcurrent(
      Object.entries(ios).map(([k, io]) => io.map((value) => [k, value] as const)),
      Function.identity,
    ).map((result) => result.foldLeft({} as Record<string, any>, (b, a) => Object.assign(b, { [a[0]]: a[1] })));
  }
}
