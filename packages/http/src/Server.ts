import type { HttpApp } from "@fncts/http/HttpApp";
import type { Middleware } from "@fncts/http/Middleware";
import type { ServerRequest } from "@fncts/http/ServerRequest";

export const ServerTypeId = Symbol.for("fncts.http.Server");
export type ServerTypeId = typeof ServerTypeId;

/**
 * @tsplus type fncts.http.Server
 * @tsplus companion fncts.http.ServerOps
 */
export abstract class Server {
  readonly [ServerTypeId]: ServerTypeId = ServerTypeId;
  abstract serve<R, E>(httpApp: HttpApp.Default<R, E>): IO<Exclude<R, ServerRequest> | Scope, never, void>;
  abstract serve<R, E, App extends HttpApp.Default<any, any>>(
    httpApp: HttpApp.Default<R, E>,
    middleware: Middleware.Applied<R, E, App>,
  ): IO<Exclude<R, ServerRequest> | Scope, never, void>;
  abstract readonly address: Address;
}

/**
 * @tsplus static fncts.http.ServerOps Tag
 */
export const ServerTag = Tag<Server>();

export type Address = TcpAddress | UnixAddress;

export interface TcpAddress {
  readonly _tag: "TcpAddress";
  readonly hostname: string;
  readonly port: number;
}

export interface UnixAddress {
  readonly _tag: "UnixAddress";
  readonly path: string;
}

/**
 * @tsplus static fncts.http.ServerOps __call
 */
export function make(options: {
  readonly serve: (httpApp: HttpApp.Default<never, unknown>, middleware?: Middleware) => IO<Scope, never, void>;
  readonly address: Address;
}): Server {
  return new (class extends Server {
    serve = options.serve;
    address = options.address;
  })();
}

/**
 * @tsplus pipeable fncts.http.HttpApp serve
 */
export function serve(): <R, E>(
  httpApp: HttpApp.Default<R, E>,
) => Layer<Server | Exclude<R, ServerRequest | Scope>, never, never>;
export function serve<R, E, App extends HttpApp.Default<any, any>>(
  middleware: Middleware.Applied<R, E, App>,
): (
  httpApp: HttpApp.Default<R, E>,
  middleware: Middleware.Applied<R, E, App>,
) => Layer<Server | Exclude<R, ServerRequest | Scope>, never, never>;
export function serve<R, E, App extends HttpApp.Default<any, any>>(
  middleware?: Middleware.Applied<R, E, App>,
): (httpApp: HttpApp.Default<R, E>) => Layer<Server | Exclude<R, ServerRequest | Scope>, never, never> {
  return (httpApp) =>
    Layer.scopedDiscard(IO.service(Server.Tag).flatMap((server) => server.serve(httpApp, middleware!))) as any;
}

/**
 * @tsplus pipeable fncts.http.HttpApp serveIO
 */
export function serveIO(): <R, E>(
  httpApp: HttpApp.Default<R, E>,
) => IO<Server | Exclude<R, ServerRequest | Scope>, never, never>;
export function serveIO<R, E, App extends HttpApp.Default<any, any>>(
  middleware: Middleware.Applied<R, E, App>,
): (
  httpApp: HttpApp.Default<R, E>,
  middleware: Middleware.Applied<R, E, App>,
) => IO<Server | Exclude<R, ServerRequest | Scope>, never, never>;
export function serveIO<R, E, App extends HttpApp.Default<any, any>>(
  middleware?: Middleware.Applied<R, E, App>,
): (httpApp: HttpApp.Default<R, E>) => IO<Server | Exclude<R, ServerRequest | Scope>, never, never> {
  return (httpApp) => IO.service(Server.Tag).flatMap((server) => server.serve(httpApp, middleware!)) as any;
}
