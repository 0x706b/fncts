export const HeadersTypeId = Symbol.for("fncts.http.Headers");
export type HeadersTypeId = typeof HeadersTypeId;

/**
 * @tsplus type fncts.http.Headers
 * @tsplus companion fncts.http.HeadersOps
 */
export class Headers {
  readonly [HeadersTypeId]: HeadersTypeId = HeadersTypeId;
  constructor(readonly backing: HashMap<string, string>) {}

  set(key: string, value: string): Headers {
    return new Headers(this.backing.set(key.toLowerCase(), value));
  }

  remove(key: string): Headers {
    return new Headers(this.backing.remove(key.toLowerCase()));
  }

  get(key: string): Maybe<string> {
    return this.backing.get(key.toLowerCase());
  }

  unsafeGet(key: string): string | undefined {
    return this.backing.unsafeGet(key.toLowerCase());
  }

  setAll(input: Headers.Input): Headers {
    const backing = this.backing.beginMutation;
    if (Symbol.iterator in input) {
      for (const [k, v] of input) {
        backing.set(k.toLowerCase(), v);
      }
      return new Headers(backing.endMutation);
    } else {
      for (const k in input) {
        backing.set(k.toLowerCase(), input[k]!);
      }
      return new Headers(backing.endMutation);
    }
  }

  toHeadersInit(): Array<[string, string]> {
    return Array.from(this.backing) as Array<[string, string]>;
  }
}

export declare module Headers {
  export type Input = Readonly<Record<string, string>> | Iterable<readonly [string, string]>;
}

/**
 * @tsplus static fncts.http.HeadersOps isHeaders
 */
export function isHeaders(u: unknown): u is Headers {
  return isObject(u) && HeadersTypeId in u;
}

/**
 * @tsplus static fncts.http.HeadersOps empty
 */
export const empty = new Headers(HashMap.empty());

/**
 * @tsplus static fncts.http.HeadersOps fromHeaders
 */
export function fromHeaders(headers: globalThis.Headers): Headers {
  const backing = HashMap.empty<string, string>().beginMutation;
  headers.forEach((value, key) => {
    backing.set(key.toLowerCase(), value);
  });
  return new Headers(backing.endMutation);
}

/**
 * @tsplus static fncts.http.HeadersOps __call
 */
export function make(input: Headers.Input): Headers {
  if (Symbol.iterator in input) {
    return new Headers(HashMap.from(input.map(([k, v]) => [k.toLowerCase(), v])));
  }

  return new Headers(HashMap.from(Object.entries(input).map(([k, v]) => [k.toLowerCase(), v] as const)));
}
