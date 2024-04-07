import type { HttpApp } from "../HttpApp.js";
import type { Route, RouteContext } from "../Route.js";
import type { RouteNotFound } from "../RouteNotFound.js";
import type { ServerRequest } from "../ServerRequest.js";
import type { ServerResponse } from "@fncts/http/ServerResponse";

import { External } from "@fncts/io/IO";

export const RouterTypeId = Symbol.for("fncts.http.Router");
export type RouterTypeId = typeof RouterTypeId;

/**
 * @tsplus type fncts.http.Router
 * @tsplus companion fncts.http.RouterOps
 */
export abstract class Router<R, E>
  extends External<Exclude<R, RouteContext>, E | RouteNotFound, ServerResponse>
  implements HttpApp.Default<Exclude<R, RouteContext>, E | RouteNotFound>
{
  readonly [RouterTypeId]: RouterTypeId = RouterTypeId;
  abstract readonly routes: Conc<Route<R, E>>;
  abstract readonly mounts: Conc<
    Readonly<{ prefix: string; httpApp: HttpApp.Default<R, E>; options?: { readonly inclduePrefix?: boolean } }>
  >;
}

export declare namespace Router {
  export type ExcludeProvided<A> = Exclude<A, RouteContext | ServerRequest | Scope>;
}
