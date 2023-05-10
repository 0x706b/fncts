import type { _A, _E, _R } from "@fncts/base/types";

/**
 * @tsplus static fncts.io.IOOps all
 */
export function all<T extends ReadonlyArray<IO<any, any, any>>>(
  ios: [...T],
): IO<
  { [K in number]: IO.EnvironmentOf<T[K]> }[number],
  { [K in number]: IO.ErrorOf<T[K]> }[number],
  { [K in keyof T]: IO.ValueOf<T[K]> }
>;
export function all<T extends Iterable<IO<any, any, any>>>(
  ios: T,
): [T] extends [Iterable<infer A>] ? IO<IO.EnvironmentOf<A>, IO.ErrorOf<A>, Conc<IO.ValueOf<A>>> : never;
export function all<T extends Record<string, IO<any, any, any>>>(
  ios: T,
): IO<
  { [K in keyof T]: IO.EnvironmentOf<T[K]> }[keyof T],
  { [K in keyof T]: IO.ErrorOf<T[K]> }[keyof T],
  { [K in keyof T]: IO.ValueOf<T[K]> }
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
  { [K in number]: IO.EnvironmentOf<T[K]> }[number],
  { [K in number]: IO.ErrorOf<T[K]> }[number],
  { [K in keyof T]: IO.ValueOf<T[K]> }
>;
export function allConcurrent<T extends Iterable<IO<any, any, any>>>(
  ios: T,
): [T] extends [Iterable<infer A>] ? IO<IO.EnvironmentOf<A>, IO.ErrorOf<A>, Conc<IO.ValueOf<A>>> : never;
export function allConcurrent<T extends Record<string, IO<any, any, any>>>(
  ios: T,
): IO<
  { [K in keyof T]: IO.EnvironmentOf<T[K]> }[keyof T],
  { [K in keyof T]: IO.ErrorOf<T[K]> }[keyof T],
  { [K in keyof T]: IO.ValueOf<T[K]> }
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
