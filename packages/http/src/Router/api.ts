import type { HttpApp } from "../HttpApp.js";
import type { Method } from "../Method.js";
import type { PathInput, Route } from "../Route.js";
import type { Router } from "./definition.js";

import { RouteImpl } from "../Route/internal.js";
import { RouterInternal } from "./internal.js";

/**
 * @tsplus static fncts.http.RouterOps empty
 */
export const empty: Router<never, never> = new RouterInternal(Conc.empty(), Conc.empty());

export function route(method: Method | "*") {
  return <R1, E1>(path: PathInput, handler: Route.Handler<R1, E1>) =>
    <R, E>(self: Router<R, E>): Router<R | Router.ExcludeProvided<R1>, E | E1> =>
      new RouterInternal<any, any>(self.routes.append(new RouteImpl(method, path, handler)), self.mounts);
}

/**
 * @tsplus pipeable fncts.http.Router get
 * @tsplus static fncts.http.RouterOps get
 */
export const get: <R1, E1>(
  path: PathInput,
  handler: Route.Handler<R1, E1>,
) => <R, E>(self: Router<R, E>) => Router<R | Router.ExcludeProvided<R1>, E | E1> = route("GET");

/**
 * @tsplus pipeable fncts.http.Router post
 * @tsplus static fncts.http.RouterOps post
 */
export const post: <R1, E1>(
  path: PathInput,
  handler: Route.Handler<R1, E1>,
) => <R, E>(self: Router<R, E>) => Router<R | Router.ExcludeProvided<R1>, E | E1> = route("POST");
/**
 * @tsplus pipeable fncts.http.Router put
 * @tsplus static fncts.http.RouterOps put
 */
export const put: <R1, E1>(
  path: PathInput,
  handler: Route.Handler<R1, E1>,
) => <R, E>(self: Router<R, E>) => Router<R | Router.ExcludeProvided<R1>, E | E1> = route("PUT");
/**
 * @tsplus pipeable fncts.http.Router patch
 * @tsplus static fncts.http.RouterOps patch
 */
export const patch: <R1, E1>(
  path: PathInput,
  handler: Route.Handler<R1, E1>,
) => <R, E>(self: Router<R, E>) => Router<R | Router.ExcludeProvided<R1>, E | E1> = route("PATCH");
/**
 * @tsplus pipeable fncts.http.Router del
 * @tsplus static fncts.http.RouterOps del
 */
export const del: <R1, E1>(
  path: PathInput,
  handler: Route.Handler<R1, E1>,
) => <R, E>(self: Router<R, E>) => Router<R | Router.ExcludeProvided<R1>, E | E1> = route("DELETE");
/**
 * @tsplus pipeable fncts.http.Router head
 * @tsplus static fncts.http.RouterOps head
 */
export const head: <R1, E1>(
  path: PathInput,
  handler: Route.Handler<R1, E1>,
) => <R, E>(self: Router<R, E>) => Router<R | Router.ExcludeProvided<R1>, E | E1> = route("HEAD");
/**
 * @tsplus pipeable fncts.http.Router options
 * @tsplus static fncts.http.RouterOps options
 */
export const options: <R1, E1>(
  path: PathInput,
  handler: Route.Handler<R1, E1>,
) => <R, E>(self: Router<R, E>) => Router<R | Router.ExcludeProvided<R1>, E | E1> = route("OPTIONS");

/**
 * @tsplus pipeable fncts.http.Router use
 * @tsplus static fncts.http.RouterOps use
 */
export function use<R, E, R1, E1>(f: (self: Route.Handler<R, E>) => HttpApp.Default<R1, E1>, __tsplusTrace?: string) {
  return (self: Router<R, E>): Router<Router.ExcludeProvided<R1>, E1> =>
    new RouterInternal<any, any>(
      self.routes.map((route) => new RouteImpl(route.method, route.path, f(route.handler as any), route.prefix)),
      self.mounts.map(({ prefix, httpApp }) => ({ prefix, httpApp: f(httpApp as any) })),
    );
}

/**
 * @tsplus static fncts.http.RouterOps from
 */
export function from<R extends Route<any, any>>(
  routes: Iterable<R>,
): Router<R extends Route<infer Env, infer _> ? Env : never, R extends Route<infer _, infer E> ? E : never> {
  return new RouterInternal(Conc.from(routes), Conc.empty());
}

/**
 * @tsplus pipeable fncts.http.Router concat
 */
export function concat<R1, E1>(that: Router<R1, E1>) {
  return <R, E>(self: Router<R, E>): Router<R | R1, E | E1> =>
    new RouterInternal(self.routes.concat(that.routes) as Conc<Route<R | R1, E | E1>>, self.mounts);
}

function removeTrailingSlash(path: PathInput): PathInput {
  return (path.endsWith("/") ? path.slice(0, -1) : path) as PathInput;
}

/**
 * @tsplus pipeable fncts.http.Router prefixAll
 */
export function prefixAll(prefix: PathInput) {
  return <R, E>(self: Router<R, E>): Router<R, E> => {
    prefix = removeTrailingSlash(prefix);
    return new RouterInternal(
      self.routes.map(
        (route) =>
          new RouteImpl(
            route.method,
            route.path === "/" ? prefix : ((prefix + route.path) as PathInput),
            route.handler,
            route.prefix.map((_) => prefix + _).orElse(Just(prefix)),
          ),
      ),
      self.mounts.map(({ prefix: path, httpApp }) => ({ prefix: path === "/" ? prefix : prefix + path, httpApp })),
    );
  };
}

/**
 * @tsplus pipeable fncts.http.Router mount
 */
export function mount<R1, E1>(path: `/${string}`, that: Router<R1, E1>) {
  return <R, E>(self: Router<R, E>): Router<R | R1, E | E1> => self.concat(that.prefixAll(path));
}

/**
 * @tsplus pipeable fncts.http.Router catchAll
 */
export function catchAll<E, R1, E1>(f: (e: E) => Route.Handler<R1, E1>, __tsplusTrace?: string) {
  return <R>(self: Router<R, E>): Router<R | Router.ExcludeProvided<R1>, E1> =>
    self.use((handler) => handler.catchAll(f));
}

/**
 * @tsplus pipeable fncts.http.Router catchAllCause
 */
export function catchAllCause<E, R1, E1>(f: (e: Cause<E>) => Route.Handler<R1, E1>, __tsplusTrace?: string) {
  return <R>(self: Router<R, E>): Router<R | Router.ExcludeProvided<R1>, E1> =>
    self.use((handler) => handler.catchAllCause(f));
}

/**
 * @tsplus pipeable fncts.http.Router provideService
 */
export function provideService<T>(service: T, tag: Tag<T>, __tsplusTrace?: string) {
  return <R, E>(self: Router<R, E>): Router<Exclude<R, T>, E> =>
    self.use((handler) => handler.provideSomeService(service, tag));
}
