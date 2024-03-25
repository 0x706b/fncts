import type { BodyError } from "../BodyError.js";
import type { Options } from "./definition";

import { Body, BodyTag } from "../Body.js";
import { Headers } from "../Headers.js";
import { UrlParams } from "../UrlParams.js";
import { ServerResponse } from "./definition.js";

/**
 * @tsplus static fncts.http.ServerResponseOps empty
 */
export function empty(options?: Options.WithContent): ServerResponse {
  return new ServerResponse(options?.status ?? 204, options?.statusText, options?.headers ?? Headers.empty, Body.empty);
}

/**
 * @tsplus static fncts.http.ServerResponseOps uint8Array
 */
export function uint8Array(body: Uint8Array, options?: Options.WithContentType): ServerResponse {
  return new ServerResponse(
    options?.status ?? 200,
    options?.statusText,
    options?.headers ?? Headers.empty,
    Body.uint8Array(body, getContentType(options)),
  );
}

/**
 * @tsplus static fncts.http.ServerResponseOps text
 */
export function text(body: string, options?: Options.WithContentType): ServerResponse {
  return new ServerResponse(
    options?.status ?? 200,
    options?.statusText,
    options?.headers ?? Headers.empty,
    Body.text(body, getContentType(options)),
  );
}

/**
 * @tsplus static fncts.http.ServerResponseOps json
 */
export function json(body: unknown, options?: Options.WithContent): IO<never, BodyError, ServerResponse> {
  return Body.json(body).map(
    (body) => new ServerResponse(options?.status ?? 200, options?.statusText, options?.headers ?? Headers.empty, body),
  );
}

/**
 * @tsplus static fncts.http.ServerResponseOps schemaJson
 */
export function schemaJson<A>(schema: Schema<A>) {
  const encode = Body.jsonSchema(schema);
  return (body: A, options?: Options.WithContent): IO<never, BodyError, ServerResponse> =>
    encode(body).map(
      (body) =>
        new ServerResponse(options?.status ?? 200, options?.statusText, options?.headers ?? Headers.empty, body),
    );
}

/**
 * @tsplus static fncts.http.ServerResponseOps urlParams
 */
export function urlParams(body: UrlParams.Input, options?: Options.WithContent): ServerResponse {
  return new ServerResponse(
    options?.status ?? 200,
    options?.statusText,
    options?.headers ?? Headers.empty,
    Body.text(UrlParams(body).toString(), "application/x-www-form-urlencoded"),
  );
}

/**
 * @tsplus static fncts.http.ServerResponseOps stream
 */
export function stream(body: Stream<never, unknown, Uint8Array>, options?: Options): ServerResponse {
  return new ServerResponse(
    options?.status ?? 200,
    options?.statusText,
    options?.headers ?? Headers.empty,
    Body.stream(body, {
      contentType: getContentType(options),
      contentLength: options?.contentLength,
    }),
  );
}

/**
 * @tsplus pipeable fncts.http.ServerResponse setHeader
 */
export function setHeader(key: string, value: string) {
  return (self: ServerResponse): ServerResponse =>
    new ServerResponse(self.status, self.statusText, self.headers.set(key, value), self.body);
}

/**
 * @tsplus pipeable fncts.http.ServerResponse setHeaders
 */
export function setHeaders(headers: Headers.Input) {
  return (self: ServerResponse): ServerResponse =>
    new ServerResponse(self.status, self.statusText, self.headers.setAll(headers), self.body);
}

/**
 * @tsplus pipeable fncts.http.ServerResponse setStatus
 */
export function setStatus(status: number, statusText?: string) {
  return (self: ServerResponse): ServerResponse => new ServerResponse(status, statusText, self.headers, self.body);
}

/**
 * @tsplus pipeable fncts.http.ServerResponse setBody
 */
export function setBody(body: Body) {
  return (self: ServerResponse): ServerResponse => {
    let headers = self.headers;
    body.concrete();
    if (body._tag === BodyTag.Empty) {
      headers = self.headers.remove("content-type").remove("content-length");
    }
    return new ServerResponse(self.status, self.statusText, headers, body);
  };
}

/**
 * @tsplus pipeable fncts.http.ServerResponse toWeb
 */
export function toWeb(withoutBody = false) {
  return (self: ServerResponse): Response => {
    if (withoutBody) {
      return new Response(undefined, {
        status: self.status,
        statusText: self.statusText,
        headers: self.headers.toHeadersInit(),
      });
    }

    self.body.concrete();
    switch (self.body._tag) {
      case BodyTag.Empty:
        return new Response(undefined, {
          status: self.status,
          statusText: self.statusText,
          headers: self.headers.toHeadersInit(),
        });
      case BodyTag.Uint8Array:
      case BodyTag.Raw:
        return new Response(self.body.body as any, {
          status: self.status,
          statusText: self.statusText,
          headers: self.headers.toHeadersInit(),
        });
      case BodyTag.FormData:
        return new Response(self.body.formData, {
          status: self.status,
          statusText: self.statusText,
          headers: self.headers.toHeadersInit(),
        });
      case BodyTag.Stream:
        return new Response(self.body.stream.toReadableStream, {
          status: self.status,
          statusText: self.statusText,
          headers: self.headers.toHeadersInit(),
        });
    }
  };
}

function getContentType(options: Options | undefined): string | undefined {
  if (options?.contentType) {
    return options.contentType;
  } else if (options?.headers) {
    return options.headers.unsafeGet("content-type");
  } else {
    return;
  }
}
