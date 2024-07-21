import type { Method } from "../Method.js";
import type { ServerRequest } from "../ServerRequest";
import type { ServerResponse } from "../ServerResponse.js";

export const RouteTypeId = Symbol.for("fncts.http.RouteTypeId");
export type RouteTypeId = typeof RouteTypeId;

export type PathInput = `/${string}` | "*";

/**
 * @tsplus type fncts.http.Route
 * @tsplus companion fncts.http.RouteOps
 */
export abstract class Route<R, E> {
  readonly [RouteTypeId]: RouteTypeId = RouteTypeId;

  abstract readonly method: Method | "*";
  abstract readonly path: PathInput;
  abstract readonly handler: Route.Handler<R, E>;
  abstract readonly prefix: Maybe<string>;
}

export declare namespace Route {
  export type Handler<R, E> = IO<R | ServerRequest | RouteContext, E, ServerResponse>;
}

export const RouteContextTypeId = Symbol.for("fncts.http.RouteContextTypeId");
export type RouteContextTypeId = typeof RouteContextTypeId;

/**
 * @tsplus type fncts.http.RouteContext
 * @tsplus companion fncts.http.RouteContextOps
 */
export abstract class RouteContext {
  readonly [RouteContextTypeId]: RouteContextTypeId = RouteContextTypeId;
  abstract readonly route: Route<unknown, unknown>;
  abstract readonly params: Readonly<Record<string, string | undefined>>;
  abstract readonly searchParams: Readonly<Record<string, string | ReadonlyArray<string>>>;
}

/**
 * @tsplus static fncts.http.RouteContextOps Tag
 */
export const RouteContextTag = Tag<RouteContext>();
