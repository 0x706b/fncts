import type * as Http from "node:http";

import { Maybe } from "@fncts/base/data/Maybe";
import { Headers } from "@fncts/http/Headers";
import { IncomingMessage } from "@fncts/http/IncomingMessage";
import { UrlParams } from "@fncts/http/UrlParams";

import * as NodeStream from "../stream.js";

export abstract class IncomingMessageImpl<E> extends IncomingMessage<E> {
  constructor(
    readonly source: Http.IncomingMessage,
    readonly onError: (error: unknown) => E,
    readonly remoteAddressOverride?: string,
  ) {
    super();
  }

  get headers(): Headers {
    return Headers(this.source.headers as any);
  }

  get remoteAddress(): Maybe<string> {
    return Maybe.fromNullable(this.remoteAddressOverride ?? this.source.socket.remoteAddress);
  }

  private textIO: IO<never, E, string> | undefined;
  get text(): IO<never, E, string> {
    if (this.textIO) {
      return this.textIO;
    }

    this.textIO = NodeStream.toString(this.source, this.onError).memoize.unsafeRun.getOrThrow;

    return this.textIO;
  }

  get json(): IO<never, E, unknown> {
    return this.text.flatMap((text) => IO.tryCatch(() => JSON.parse(text), this.onError));
  }

  get urlParamsBody(): IO<never, E, UrlParams> {
    return this.text.flatMap((text) => IO.tryCatch(() => UrlParams(new URLSearchParams(text)), this.onError));
  }

  private arrayBufferIO: IO<never, E, ArrayBuffer> | undefined;
  get arrayBuffer(): IO<never, E, ArrayBuffer> {
    if (this.arrayBufferIO) {
      return this.arrayBufferIO;
    }

    this.arrayBufferIO = NodeStream.toUint8Array(this.source, this.onError).memoize.unsafeRun.getOrThrow;

    return this.arrayBufferIO;
  }

  get stream(): Stream<never, E, Uint8Array> {
    return NodeStream.fromReadable<E, Uint8Array>(this.source, this.onError);
  }
}
