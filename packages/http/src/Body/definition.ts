import type * as Stream_ from "@fncts/io/Stream";

export const BodyTypeId = Symbol.for("fncts.http.BodyTypeId");
export type BodyTypeId = typeof BodyTypeId;

export const enum BodyTag {
  Empty,
  Raw,
  Uint8Array,
  FormData,
  Stream,
}

/**
 * @tsplus type fncts.http.Body
 * @tsplus companion fncts.http.BodyOps
 */
export abstract class Body {
  readonly [BodyTypeId]: BodyTypeId = BodyTypeId;
  readonly contentType?: string;
  readonly contentLength?: number;
}

export class Empty extends Body {
  readonly _tag = BodyTag.Empty;
}

export class Raw extends Body {
  readonly _tag = BodyTag.Raw;
  constructor(
    readonly body: unknown,
    readonly contentType?: string,
    readonly contentLength?: number,
  ) {
    super();
  }
}

export class Uint8Array extends Body {
  readonly _tag = BodyTag.Uint8Array;
  constructor(
    readonly body: globalThis.Uint8Array,
    readonly contentType: string,
  ) {
    super();
  }
}

export class FormData extends Body {
  readonly _tag = BodyTag.FormData;
  constructor(readonly formData: globalThis.FormData) {
    super();
  }
}

export class Stream extends Body {
  readonly _tag = BodyTag.Stream;
  constructor(
    readonly stream: Stream_.Stream<never, unknown, globalThis.Uint8Array>,
    readonly contentType: string,
    readonly contentLength?: number,
  ) {
    super();
  }
}

export type ConcreteBody = Empty | Raw | Uint8Array | FormData | Stream;

/**
 * @tsplus fluent fncts.http.Body concrete
 */
export function concrete(self: Body): asserts self is ConcreteBody {
  //
}
