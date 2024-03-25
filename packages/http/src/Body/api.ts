import type { BodyError } from "../BodyError.js";
import type * as Stream_ from "@fncts/io/Stream";

import { SchemaError } from "../BodyError.js";
import { JsonError } from "../BodyError.js";
import { Body, BodyTag } from "./definition.js";
import { Empty, FormData, Raw, Stream, Uint8Array } from "./definition.js";

/**
 * @tsplus static fncts.http.BodyOps empty
 */
export const empty: Empty = new Empty();

/**
 * @tsplus static fncts.http.BodyOps raw
 */
export function raw(
  body: unknown,
  options?: {
    contentType?: string;
    contentLength?: number;
  },
): Body {
  return new Raw(body, options?.contentType, options?.contentLength);
}

/**
 * @tsplus static fncts.http.BodyOps uint8Array
 */
export function uint8Array(body: globalThis.Uint8Array, contentType?: string): Body {
  return new Uint8Array(body, contentType ?? "application/octet-stream");
}

const encoder = new TextEncoder();

/**
 * @tsplus static fncts.http.BodyOps text
 */
export function text(body: string, contentType?: string): Body {
  return new Uint8Array(encoder.encode(body), contentType ?? "text/plain");
}

/**
 * @tsplus static fncts.http.BodyOps json
 */
export function json(body: unknown): IO<never, BodyError, Body> {
  return IO.tryCatch(text(JSON.stringify(body), "application/json"), (error) => new JsonError(error));
}

/**
 * @tsplus static fncts.http.BodyOps jsonSchema
 */
export function jsonSchema<A>(schema: Schema<A>) {
  const encode = schema.encode;
  return (body: A): IO<never, BodyError, Body> =>
    encode(body)
      .mapError((error) => new SchemaError(error))
      .flatMap(Body.json);
}

/**
 * @tsplus static fncts.http.BodyOps formData
 */
export function formData(body: globalThis.FormData): Body {
  return new FormData(body);
}

/**
 * @tsplus static fncts.http.BodyOps stream
 */
export function stream(
  body: Stream_.Stream<never, unknown, globalThis.Uint8Array>,
  options?: {
    contentType?: string;
    contentLength?: number;
  },
): Body {
  return new Stream(body, options?.contentType ?? "application/octet-stream", options?.contentLength);
}

/**
 * @tsplus pipeable fncts.http.Body match
 */
export function match<A, B, C, D, E>(cases: {
  Empty: (body: Empty) => A;
  Raw: (body: Raw) => B;
  Uint8Array: (body: Uint8Array) => C;
  FormData: (body: FormData) => D;
  Stream: (body: Stream) => E;
}) {
  return (body: Body): A | B | C | D | E => {
    body.concrete();
    switch (body._tag) {
      case BodyTag.Empty:
        return cases.Empty(body);
      case BodyTag.Raw:
        return cases.Raw(body);
      case BodyTag.Uint8Array:
        return cases.Uint8Array(body);
      case BodyTag.FormData:
        return cases.FormData(body);
      case BodyTag.Stream:
        return cases.Stream(body);
    }
  };
}
