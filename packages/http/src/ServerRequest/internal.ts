import type { Method } from "../Method.js";
import type { Socket } from "@fncts/http/Socket";

import { Headers } from "../Headers.js";
import { RequestError } from "../RequestError.js";
import { UrlParams } from "../UrlParams.js";
import { ServerRequest } from "./definition.js";

export class ServerRequestImpl extends ServerRequest {
  constructor(
    readonly source: Request,
    readonly url: string,
    public headersOverride?: Headers,
    private remoteAddressOverride?: string,
  ) {
    super();
  }

  get method(): Method {
    return this.source.method.toUpperCase() as Method;
  }

  get originalUrl() {
    return this.source.url;
  }

  get remoteAddress() {
    return Maybe.fromNullable(this.remoteAddressOverride);
  }

  get headers() {
    this.headersOverride ??= Headers.fromHeaders(this.source.headers);
    return this.headersOverride;
  }

  private textIO: IO<never, RequestError, string> | undefined;
  get text(): IO<never, RequestError, string> {
    if (this.textIO) {
      return this.textIO;
    }

    this.textIO = IO.fromPromiseCatch(
      this.source.text(),
      (error) => new RequestError(this, "Decode", error),
    ).memoize.unsafeRun.getOrThrow;

    return this.textIO;
  }

  get json(): IO<never, RequestError, unknown> {
    return this.text.flatMap((text) =>
      IO.tryCatch(
        () => JSON.parse(text),
        (error) => new RequestError(this, "Decode", error),
      ),
    );
  }

  get urlParamsBody(): IO<never, RequestError, UrlParams> {
    return this.text.flatMap((text) =>
      IO.tryCatch(
        () => UrlParams(new URLSearchParams(text)),
        (error) => new RequestError(this, "Decode", error),
      ),
    );
  }

  private arrayBufferIO: IO<never, RequestError, ArrayBuffer> | undefined;
  get arrayBuffer(): IO<never, RequestError, ArrayBuffer> {
    if (this.arrayBufferIO) {
      return this.arrayBufferIO;
    }

    this.arrayBufferIO = IO.fromPromiseCatch(
      this.source.arrayBuffer(),
      (error) => new RequestError(this, "Decode", error),
    ).memoize.unsafeRun.getOrThrow;

    return this.arrayBufferIO;
  }

  get stream(): Stream<never, RequestError, Uint8Array> {
    if (this.source.body) {
      return Stream.fromReadableStream(this.source.body, (error) => new RequestError(this, "Decode", error));
    } else {
      return Stream.failNow(new RequestError(this, "Decode", "cannot create stream from empty body"));
    }
  }

  modify(options: {
    readonly url?: string | undefined;
    readonly headers?: Headers | undefined;
    readonly remoteAddress?: string | undefined;
  }): ServerRequest {
    return new ServerRequestImpl(
      this.source,
      options.url ?? this.url,
      options.headers ?? this.headers,
      options.remoteAddress ?? this.remoteAddressOverride,
    );
  }

  get upgrade(): IO<never, RequestError, Socket> {
    return IO.failNow(new RequestError(this, "Decode", "Not an upgradeable ServerRequest"));
  }
}
