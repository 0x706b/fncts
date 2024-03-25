import type { HttpApp } from "../HttpApp.js";
import type { ServerResponse } from "../ServerResponse.js";

import * as FindMyWay from "find-my-way-ts";

import { type PathInput, type Route, RouteContext } from "../Route.js";
import { RouteContextImpl, RouteImpl } from "../Route/internal.js";
import { RouteNotFound } from "../RouteNotFound.js";
import { ServerRequest } from "../ServerRequest.js";
import { Router } from "./definition.js";

export class RouterInternal<R, E> extends Router<R, E> {
  constructor(
    readonly routes: Conc<Route<R, E>>,
    readonly mounts: Conc<
      Readonly<{ prefix: string; httpApp: HttpApp.Default<R, E>; options?: { readonly inclduePrefix?: boolean } }>
    >,
  ) {
    super();
  }

  get httpApp(): HttpApp.Default<R, E | RouteNotFound> {
    return toHttpApp(this);
  }
}

function toHttpApp<R, E>(self: Router<R, E>): HttpApp.Default<R, E | RouteNotFound> {
  const router = FindMyWay.make<Route<R, E>>();

  const mounts = self.mounts.map(
    ({ prefix, httpApp, options }) =>
      [
        prefix,
        new RouteContextImpl(
          new RouteImpl(
            "*",
            options?.inclduePrefix ? (`${prefix}/*` as PathInput) : "/*",
            httpApp,
            options?.inclduePrefix ? Nothing() : Just(prefix),
          ),
          {},
          {},
        ) as RouteContext,
        options,
      ] as const,
  );
  const mountsLen = mounts.length;
  self.routes.forEach((route) => {
    if (route.method === "*") {
      router.all(route.path, route);
    } else {
      router.on(route.method, route.path, route);
    }
  });
  return IO.service(ServerRequest.Tag).flatMap((request) => {
    if (mountsLen > 0) {
      for (let i = 0; i < mountsLen; i++) {
        const [path, context, options] = mounts[i];
        if (request.url.startsWith(path)) {
          return (context.route.handler as HttpApp.Default<R, E>)
            .provideSomeService(context, RouteContext.Tag)
            .provideSomeService(options?.inclduePrefix ? request : sliceRequestUrl(request, path), ServerRequest.Tag);
        }
      }
    }

    let result = router.find(request.method, request.url);
    if (result === undefined && request.method === "HEAD") {
      result = router.find("GET", request.url);
    }
    if (result === undefined) {
      return IO.failNow(new RouteNotFound(request));
    }
    const route = result.handler;
    if (route.prefix.isJust()) {
      request = sliceRequestUrl(request, route.prefix.value);
    }
    return (route.handler as IO<Router.ExcludeProvided<R>, E, ServerResponse>).contramapEnvironment((environment) =>
      environment
        .add(request, ServerRequest.Tag)
        .add(new RouteContextImpl(route, result.params, result.searchParams), RouteContext.Tag),
    );
  });
}

function sliceRequestUrl(request: ServerRequest, prefix: string) {
  const prefixLen = prefix.length;
  return request.modify({ url: request.url.length <= prefixLen ? "/" : request.url.slice(prefixLen) });
}
