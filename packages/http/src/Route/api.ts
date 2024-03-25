import type { Method } from "../Method.js";
import type { PathInput, Route } from "./definition.js";

import { RouteContext } from "./definition.js";
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
  method: Method,
  path: PathInput,
  handler: Route.Handler<R, E>,
  prefix: Maybe<string> = Nothing(),
): Route<R, E> {
  return new RouteImpl(method, path, handler, prefix);
}
