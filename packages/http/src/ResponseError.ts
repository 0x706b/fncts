import type { ServerRequest } from "@fncts/http/ServerRequest";
import type { ServerResponse } from "@fncts/http/ServerResponse";

export const ResponseErrorTypeId = Symbol.for("fncts.http.ResponseError");
export type ResponseErrorTypeId = typeof ResponseErrorTypeId;

export class ResponseError extends Error {
  readonly [ResponseErrorTypeId]: ResponseErrorTypeId = ResponseErrorTypeId;
  constructor(
    readonly request: ServerRequest,
    readonly response: ServerResponse,
    readonly reason: "Decode",
    readonly error: unknown,
  ) {
    super();
  }

  get methodAndUrl() {
    return `${this.request.method} ${this.request.url}`;
  }

  get message() {
    return `${this.reason} error (${this.response.status} ${this.methodAndUrl}): ${super.message}`;
  }
}
