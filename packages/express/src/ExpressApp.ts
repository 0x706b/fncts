import type { ExpressAppConfig } from "./ExpressAppConfig.js";
import type { ErasedRequestHandlerIO, RequestHandlerRouteIO } from "./RequestHandlerIO";
import type { _R } from "@fncts/base/types";
import type { Express, NextFunction, Request, RequestHandler, Response } from "express";
import type { Server } from "http";

import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { Runtime } from "@fncts/io/IO";
import express from "express";

import { NodeServerCloseError, NodeServerListenError } from "./errors.js";
import { defaultExitHandler } from "./ExitHandler.js";
import { LiveExpressAppConfig } from "./ExpressAppConfig.js";
import { ExpressAppConfigTag } from "./ExpressAppConfig.js";

export interface ExpressApp {
  readonly app: Express;
  readonly server: Server;
  readonly runtime: <Handlers extends Array<RequestHandlerRouteIO>>(
    handlers: Handlers,
  ) => IO<
    _R<
      {
        [k in keyof Handlers]: [Handlers[k]] extends [ErasedRequestHandlerIO<infer R>] ? URIO<R, void> : never;
      }[number]
    >,
    never,
    ReadonlyArray<RequestHandler>
  >;
}

export const ExpressAppTag = Tag<ExpressApp>("fncts.express.ExpressApp");

export const makeExpressApp: IO<Scope | ExpressAppConfig, never, ExpressApp> = Do((Δ) => {
  const open = Δ(IO.succeed(new AtomicBoolean(true)).acquireRelease((_) => IO.succeed(() => _.set(false))));

  const app = Δ(IO.succeed(() => express()));

  const config = Δ(IO.service(ExpressAppConfigTag));

  const server = Δ(
    IO.async<never, never, Server>((cb) => {
      const onError = (err: Error) => {
        cb(IO.halt(new NodeServerListenError(err)));
      };
      const server = app.listen(config.port, config.host, () => {
        cb(
          IO.succeed(() => {
            server.removeListener("error", onError);
            return server;
          }),
        );
      });
      server.addListener("error", onError);
    }).acquireRelease((server) =>
      IO.async<never, never, void>((cb) => {
        server.close((err) => {
          if (err) {
            cb(IO.halt(new NodeServerCloseError(err)));
          } else {
            cb(IO.unit());
          }
        });
      }),
    ),
  );

  function runtime<Handlers extends Array<RequestHandlerRouteIO>>(handlers: Handlers) {
    return IO.runtime<
      _R<
        {
          [k in keyof Handlers]: [Handlers[k]] extends [ErasedRequestHandlerIO<infer R>] ? URIO<R, void> : never;
        }[number]
      >
    >()
      .map((r) => new Runtime(r.environment, r.runtimeFlags, r.fiberRefs))
      .map((r) =>
        handlers.map(
          (handler): RequestHandler =>
            (req, res, next) => {
              r.unsafeRunFiber(
                (open.get ? handler(req, res, next) : IO.interrupt).onTermination(config.exitHandler(req, res, next)),
              );
            }
        ),
      );
  }

  return {
    app,
    server,
    runtime,
  };
});

export const LiveExpressApp = Layer.scoped(makeExpressApp, ExpressAppTag);

export type ExpressEnv = ExpressAppConfig | ExpressApp;

export function LiveExpress(host: string, port: number): Layer<never, never, ExpressEnv>;
export function LiveExpress<R>(
  host: string,
  port: number,
  exitHandler: (req: Request, res: Response, next: NextFunction) => (cause: Cause<never>) => URIO<R, void>,
): Layer<R, never, ExpressEnv>;
export function LiveExpress<R>(
  host: string,
  port: number,
  exitHandler?: (req: Request, res: Response, next: NextFunction) => (cause: Cause<never>) => URIO<R, void>,
): Layer<R, never, ExpressEnv> {
  return LiveExpressAppConfig(host, port, exitHandler ?? defaultExitHandler).andTo(LiveExpressApp);
}

export function expressRuntime<Handlers extends Array<RequestHandlerRouteIO>>(
  handlers: never extends Handlers ? Array<RequestHandlerRouteIO> : Handlers,
): IO<
  | _R<
      {
        [k in keyof Handlers]: [Handlers[k]] extends [ErasedRequestHandlerIO<infer R>] ? URIO<R, void> : never;
      }[number]
    >
  | ExpressApp,
  never,
  ReadonlyArray<RequestHandler>
> {
  return IO.serviceWithIO((_) => _.runtime(handlers), ExpressAppTag);
}
