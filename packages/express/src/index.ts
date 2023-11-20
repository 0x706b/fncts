import type { ExpressApp, ExpressEnv } from "./ExpressApp.js";
import type { ErasedRequestHandlerIO, RequestHandlerIO, RequestHandlerRouteIO } from "./RequestHandlerIO.js";
import type { _R } from "@fncts/base/types";
import type { NextHandleFunction } from "connect";
import type { RequestHandler } from "express";
import type { RouteParameters } from "express-serve-static-core";

import { ExpressAppTag, expressRuntime } from "./ExpressApp.js";

export * from "./errors.js";
export * from "./ExitHandler.js";
export * from "./ExpressApp.js";
export * from "./ExpressAppConfig.js";
export * from "./RequestHandlerIO.js";

export const methods = [
  "all",
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
  "checkout",
  "connect",
  "copy",
  "lock",
  "merge",
  "mkactivity",
  "mkcol",
  "move",
  "m-search",
  "notify",
  "propfind",
  "proppatch",
  "purge",
  "report",
  "search",
  "subscribe",
  "trace",
  "unlock",
  "unsubscribe",
] as const;

export type Methods = (typeof methods)[number];

export type PathParams = string | RegExp | Array<string | RegExp>;

export interface ParamsDictionary {
  [key: string]: string;
}

export function match(method: Methods): {
  <Route extends string, Handlers extends Array<RequestHandlerRouteIO<any, Route>>>(
    path: Route,
    ...handlers: never extends Handlers ? Array<RequestHandlerIO<any, Route, RouteParameters<Route>>> : Handlers
  ): URIO<
    | ExpressEnv
    | IO.EnvironmentOf<
        {
          [k in keyof Handlers]: [Handlers[k]] extends [ErasedRequestHandlerIO<infer R>] ? URIO<R, void> : never;
        }[number]
      >,
    void
  >;
} {
  return function (path, ...handlers) {
    return expressRuntime(handlers as Array<ErasedRequestHandlerIO<never>>).flatMap((expressHandlers) =>
      IO.serviceWithIO(
        (service: ExpressApp) => IO.succeed(() => service.app[method](path, ...expressHandlers)),
        ExpressAppTag,
      ),
    );
  };
}

export function use<Handlers extends Array<RequestHandlerRouteIO>>(
  ...handlers: Handlers
): URIO<
  | ExpressEnv
  | _R<
      {
        [k in keyof Handlers]: [Handlers[k]] extends [ErasedRequestHandlerIO<infer R>] ? URIO<R, void> : never;
      }[number]
    >,
  void
>;
export function use<Route extends string, Handlers extends Array<RequestHandlerRouteIO<any, Route>>>(
  path: Route,
  ...handlers: never extends Handlers ? Array<RequestHandlerRouteIO<any, Route>> : Handlers
): URIO<
  | ExpressEnv
  | _R<
      {
        [k in keyof Handlers]: [Handlers[k]] extends [ErasedRequestHandlerIO<infer R>] ? URIO<R, void> : never;
      }[number]
    >,
  void
>;
export function use(...args: Array<any>): URIO<ExpressEnv, void> {
  return IO.serviceWithIO((service: ExpressApp) => {
    if (typeof args[0] === "function") {
      return expressRuntime(args as Array<RequestHandlerRouteIO>).flatMap((expressHandlers) =>
        IO.succeed(() => service.app.use(...expressHandlers)),
      );
    } else {
      return expressRuntime((args as Array<RequestHandlerRouteIO>).slice(1) ?? []).flatMap((expressHandlers) =>
        IO.succeed(() => service.app.use(args[0], ...expressHandlers)),
      );
    }
  }, ExpressAppTag).asUnit;
}

export const all = match("all");
export const get = match("get");
export const post = match("post");
export const put = match("put");
const delete_ = match("delete");
export { delete_ as delete };
export const patch = match("patch");
export const options = match("options");
export const head = match("head");
export const checkout = match("checkout");
export const connect = match("connect");
export const copy = match("copy");
export const lock = match("lock");
export const merge = match("merge");
export const mkactivity = match("mkactivity");
export const mkcol = match("mkcol");
export const move = match("move");
export const mSearch = match("m-search");
export const notify = match("notify");
export const propfind = match("propfind");
export const proppatch = match("proppatch");
export const purge = match("purge");
export const report = match("report");
export const search = match("search");
export const subscribe = match("subscribe");
export const trace = match("trace");
export const unlock = match("unlock");
export const unsubscribe = match("unsubscribe");

/**
 * Lift an express requestHandler into an effectified variant
 */
export function classic(_: NextHandleFunction): RequestHandlerIO<never, any>;
export function classic(_: RequestHandler): RequestHandlerIO<never, any>;
export function classic(_: RequestHandler | NextHandleFunction): RequestHandlerIO<never, any> {
  return (req, res, next) => IO.succeed(() => _(req, res, next));
}
