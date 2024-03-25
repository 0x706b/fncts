import type { ServerRequest } from "./ServerRequest.js";

export const RouteNotFoundTypeId = Symbol.for("fncts.http.RouteNotFound");
export type RouteNotFoundTypeId = typeof RouteNotFoundTypeId;

export class RouteNotFound extends Error {
  constructor(readonly request: ServerRequest) {
    super();
  }

  get message() {
    return `${this.request.method} ${this.request.url} not found`;
  }
}
