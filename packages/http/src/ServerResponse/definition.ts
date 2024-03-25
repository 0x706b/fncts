import type { Body } from "../Body.js";

import { Headers } from "../Headers.js";

export const ServerResponseTypeId = Symbol.for("fncts.http.ServerResponse");
export type ServerResponseTypeId = typeof ServerResponseTypeId;

/**
 * @tsplus type fncts.http.ServerResponse
 * @tsplus companion fncts.http.ServerResponseOps
 */
export class ServerResponse {
  readonly [ServerResponseTypeId]: ServerResponseTypeId = ServerResponseTypeId;
  readonly headers: Headers;
  constructor(
    readonly status: number,
    readonly statusText: string | undefined,
    headers: Headers,
    readonly body: Body,
  ) {
    if (body.contentType || body.contentLength) {
      const newHeaders = headers.backing.beginMutation;
      if (body.contentType) {
        newHeaders.set("content-type", body.contentType);
      }
      if (body.contentLength) {
        newHeaders.set("content-length", body.contentLength.toString());
      }
      this.headers = new Headers(newHeaders.endMutation);
    } else {
      this.headers = headers;
    }
  }
}

export interface Options {
  status?: number;
  statusText?: string;
  headers?: Headers;
  contentType?: string;
  contentLength?: number;
}

export declare namespace Options {
  export interface WithContent extends Omit<Options, "contentType" | "contentLength"> {}
  export interface WithContentType extends Omit<Options, "contentLength"> {}
}

export function isServerResponse(u: unknown): u is ServerResponse {
  return isObject(u) && ServerResponseTypeId in u;
}
