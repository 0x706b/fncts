/**
 * @tsplus type fncts.http.UrlParams
 * @tsplus type fncts.http.UrlParamsOps
 */
export class UrlParams {
  constructor(readonly backing: ReadonlyArray<readonly [string, string]>) {}
}

export declare module UrlParams {
  export type Input = Readonly<Record<string, string>> | Iterable<readonly [string, string]> | URLSearchParams;
}

/**
 * @tsplus static fncts.http.UrlParamsOps __call
 */
export function make(input: UrlParams.Input): UrlParams {
  if (Symbol.iterator in input) {
    return new UrlParams(Array.from(input));
  }
  return new UrlParams(Array.from(Object.entries(input)));
}

/**
 * @tsplus fluent fncts.http.UrlParams toString
 */
export function toString(self: UrlParams): string {
  return new URLSearchParams(self.backing as Array<[string, string]>).toString();
}
