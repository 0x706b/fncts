import type { Method } from "../Method.js";
import type { PathInput } from "./definition.js";

import { Route, RouteContext } from "./definition.js";
import { RouteImpl } from "./internal.js";

/**
 * @tsplus static fncts.http.RouteContextOps params
 */
export const params = IO.service(RouteContext.Tag).map((routeContext) => routeContext.params);

/**
 * @tsplus static fncts.http.RouteContextOps searchParams
 */
export const searchParams = IO.service(RouteContext.Tag).map((routeContext) => routeContext.searchParams);

/**
 * @tsplus static fncts.http.RouteContextOps schemaParams
 */
export function schemaParams<A>(schema: Schema<A>): IO<RouteContext, ParseFailure, A> {
  const decode = schema.decode;
  return IO.service(RouteContext.Tag).flatMap((routeContext) =>
    decode({ ...routeContext.params, ...routeContext.searchParams }),
  );
}

/**
 * @tsplus static fncts.http.RouteContextOps schemaPathParams
 */
export function schemaPathParams<A>(schema: Schema<A>): IO<RouteContext, ParseFailure, A> {
  const decode = schema.decode;
  return params.flatMap(decode);
}

/**
 * @tsplus static fncts.http.RouteContextOps schemaSearchParams
 */
export function schemaSearchParams<A>(schema: Schema<A>): IO<RouteContext, ParseFailure, A> {
  const decode = schema.decode;
  return searchParams.flatMap(decode);
}

/**
 * @tsplus static fncts.http.RouteOps __call
 */
export function make<R, E>(
  method: Method | "*",
  path: PathInput,
  handler: Route.Handler<R, E>,
  prefix: Maybe<string> = Nothing(),
): Route<R, E> {
  return new RouteImpl(method, path, handler, prefix);
}

export function route(method: Method | "*") {
  return <R, E>(path: PathInput, handler: Route.Handler<R, E>): Route<R, E> => {
    return Route(method, path, handler);
  };
}

/**
 * @tsplus static fncts.http.RouteOps get
 */
export const get: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("GET");

/**
 * @tsplus static fncts.http.RouteOps post
 */
export const post: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("POST");

/**
 * @tsplus static fncts.http.RouteOps put
 */
export const put: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("PUT");

/**
 * @tsplus static fncts.http.RouteOps patch
 */
export const patch: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("PATCH");

/**
 * @tsplus static fncts.http.RouteOps del
 */
export const del: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("DELETE");

/**
 * @tsplus static fncts.http.RouteOps head
 */
export const head: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("HEAD");

/**
 * @tsplus static fncts.http.RouteOps options
 */
export const options: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("OPTIONS");

/**
 * @tsplus static fncts.http.RouteOps all
 */
export const all: <R, E>(path: PathInput, handler: Route.Handler<R, E>) => Route<R, E> = route("*");
