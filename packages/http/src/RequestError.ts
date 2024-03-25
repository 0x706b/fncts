import type { ServerRequest } from "./ServerRequest";

export const RequestErrorTypeId = Symbol.for("fncts.http.RequestError");
export type RequestErrorTypeId = typeof RequestErrorTypeId;

export class RequestError {
  readonly [RequestErrorTypeId]: RequestErrorTypeId = RequestErrorTypeId;
  constructor(
    readonly request: ServerRequest,
    readonly reason: "Transport" | "Decode",
    readonly error: unknown,
  ) {}
}
