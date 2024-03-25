import type { Headers } from "../Headers.js";
import type { Method } from "../Method.js";
import type { RequestError } from "../RequestError.js";
import type { Socket } from "@fncts/http/Socket";

import { IncomingMessage } from "../IncomingMessage/definition.js";

export const ServerRequestTypeId = Symbol.for("fncts.http.ServerRequest");
export type ServerRequestTypeId = typeof ServerRequestTypeId;

/**
 * @tsplus type fncts.http.ServerRequest
 * @tsplus companion fncts.http.ServerRequestOps
 */
export abstract class ServerRequest extends IncomingMessage<RequestError> {
  readonly [ServerRequestTypeId]: ServerRequestTypeId = ServerRequestTypeId;

  abstract readonly source: unknown;
  abstract readonly url: string;
  abstract readonly originalUrl: string;
  abstract readonly method: Method;
  abstract upgrade: IO<never, RequestError, Socket>;
  abstract modify(options: {
    readonly url?: string;
    readonly headers?: Headers;
    readonly remoteAddress?: string;
  }): ServerRequest;
}

/**
 * @tsplus static fncts.http.ServerRequestOps Tag
 */
export const ServerRequestTag = Tag<ServerRequest>();
