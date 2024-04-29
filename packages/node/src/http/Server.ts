import type { FormData } from "@fncts/http/Body";
import type { HttpApp } from "@fncts/http/HttpApp";
import type { Middleware } from "@fncts/http/Middleware";
import type { ServerResponse } from "@fncts/http/ServerResponse";
import type * as Net from "node:net";
import type { Duplex } from "node:stream";

import { BodyTag } from "@fncts/http/Body";
import { IncomingMessage } from "@fncts/http/IncomingMessage";
import { ResponseError } from "@fncts/http/ResponseError";
import { Server } from "@fncts/http/Server";
import { clientAbortFiberId, ServeError } from "@fncts/http/ServerError";
import { ServerRequest } from "@fncts/http/ServerRequest";
import { Socket } from "@fncts/http/Socket";
import { ServerRequestImpl } from "@fncts/node/http/ServerRequest";
import * as NodeStream from "@fncts/node/stream";
import * as Http from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import * as ws from "ws";

export function make(evaluate: Lazy<Http.Server>, options: Net.ListenOptions): IO<Scope, ServeError, Server> {
  return Do((Δ) => {
    const scope = Δ(IO.scope);

    const server = Δ(
      IO.acquireRelease(IO(evaluate), (server) =>
        IO.async<never, never, void>((resume) => {
          server.close((error) => {
            if (error) {
              resume(IO.haltNow(error));
            } else {
              resume(IO.unit);
            }
          });
        }),
      ),
    );

    Δ(
      IO.async<never, ServeError, void>((resume) => {
        server.on("error", (error) => {
          resume(IO.failNow(new ServeError(error)));
        });
        server.listen(options, () => {
          resume(IO.unit);
        });
      }),
    );

    const address = server.address()!;

    const wss = Δ(
      scope.extend(
        IO.acquireRelease(IO(new ws.WebSocketServer({ noServer: true })), (wss) =>
          IO.async<never, never, void>((resume) => {
            wss.close(() => resume(IO.unit));
          }),
        ),
      ).memoize,
    );

    return Server({
      address:
        typeof address === "string"
          ? { _tag: "UnixAddress", path: address }
          : {
              _tag: "TcpAddress",
              hostname: address.address === "::" ? "0.0.0.0" : address.address,
              port: address.port,
            },
      serve: (httpApp, middleware) =>
        Do((Δ) => {
          const handler        = Δ(makeHandler(httpApp, middleware!));
          const upgradeHandler = Δ(makeUpgradeHandler(wss, httpApp, middleware!));
          Δ(
            IO.addFinalizer(
              IO(() => {
                server.off("request", handler);
                server.off("upgrade", upgradeHandler);
              }),
            ),
          );
          Δ(IO(server.on("request", handler)));
          Δ(IO(server.on("upgrade", upgradeHandler)));
        }),
    });
  });
}

export function makeHandler<R, E>(
  httpApp: HttpApp.Default<R, E>,
): IO<
  Exclude<R, ServerRequest | Scope>,
  never,
  (nodeRequest: Http.IncomingMessage, nodeResponse: Http.ServerResponse) => void
>;
export function makeHandler<R, E, App extends HttpApp.Default<any, any>>(
  httpApp: HttpApp.Default<R, E>,
  middleware: Middleware.Applied<R, E | ResponseError, App>,
): IO<
  Exclude<R, ServerRequest | Scope>,
  never,
  (nodeRequest: Http.IncomingMessage, nodeResponse: Http.ServerResponse) => void
>;
export function makeHandler<R, E, App extends HttpApp.Default<any, any>>(
  httpApp: HttpApp.Default<R, E>,
  middleware?: Middleware.Applied<R, E | ResponseError, App>,
): IO<
  Exclude<R, ServerRequest | Scope>,
  never,
  (nodeRequest: Http.IncomingMessage, nodeResponse: Http.ServerResponse) => void
> {
  const handledApp = httpApp.toHandled((request, exit) => {
    if (exit.isSuccess()) {
      return handleResponse(request, exit.value).catchAllCause((cause) => handleCause(request, cause));
    }
    return handleCause(request, exit.cause);
  }, middleware as Middleware);

  return FiberSet.makeRuntime<R, any, any>().map((runFork) => {
    return function handler(nodeRequest: Http.IncomingMessage, nodeResponse: Http.ServerResponse) {
      const fiber = runFork(
        handledApp.provideSomeService(new ServerRequestImpl(nodeRequest, nodeResponse), ServerRequest.Tag),
      );
      nodeResponse.on("close", () => {
        if (!nodeResponse.writableEnded) {
          if (!nodeResponse.headersSent) {
            nodeResponse.writeHead(499);
          }
          nodeResponse.end();
          fiber.interruptAsFork(clientAbortFiberId).unsafeRunOrFork;
        }
      });
    };
  }) as IO<
    Exclude<R, ServerRequest | Scope>,
    never,
    (nodeRequest: Http.IncomingMessage, nodeResponse: Http.ServerResponse) => void
  >;
}

export function makeUpgradeHandler<R, E>(
  wss: UIO<ws.WebSocketServer>,
  httpApp: HttpApp.Default<R, E>,
  middleware?: Middleware,
) {
  const handledApp = httpApp.toHandled((request, exit) => {
    if (exit.isSuccess()) {
      return handleResponse(request, exit.value).catchAllCause((cause) => handleCause(request, cause));
    }
    return handleCause(request, exit.cause);
  }, middleware);

  return FiberSet.makeRuntime<R, any, any>().map((runFork) => {
    return function handler(nodeRequest: Http.IncomingMessage, socket: Duplex, head: Buffer) {
      let nodeResponse_: Http.ServerResponse | undefined = undefined;

      const nodeResponse = () => {
        if (nodeResponse_ === undefined) {
          nodeResponse_ = new Http.ServerResponse(nodeRequest);
          nodeResponse_.assignSocket(socket as any);
        }
        return nodeResponse_;
      };

      const upgradeEffect = Socket.fromWebSocket(
        wss.flatMap((wss) =>
          IO.acquireRelease(
            IO.async<never, never, globalThis.WebSocket>((resume) => {
              wss.handleUpgrade(nodeRequest, socket, head, (ws) => {
                resume(IO.succeedNow(ws as any));
              });
            }),
            (ws) => IO(ws.close()),
          ),
        ),
      );

      const fiber = runFork(
        handledApp.provideSomeService(
          new ServerRequestImpl(nodeRequest, nodeResponse, upgradeEffect),
          ServerRequest.Tag,
        ),
      );

      socket.on("close", () => {
        const res = nodeResponse();
        if (!socket.writableEnded) {
          if (!res.headersSent) {
            res.writeHead(499);
          }
          res.end();
          fiber.interruptAsFork(clientAbortFiberId).unsafeRunOrFork;
        }
      });
    };
  });
}

function handleCause<E>(request: ServerRequest, cause: Cause<E>) {
  return IO(() => {
    const nodeResponse = (request as ServerRequestImpl).resolvedResponse;
    if (!nodeResponse.headersSent) {
      nodeResponse.writeHead(cause.isInterruptedOnly ? 503 : 500);
    }
    if (!nodeResponse.writableEnded) {
      nodeResponse.end();
    }
  });
}

export function handleResponse(request: ServerRequest, response: ServerResponse) {
  return IO.defer((): IO<never, ResponseError, void> => {
    const nodeResponse = (request as ServerRequestImpl).resolvedResponse;
    if (nodeResponse.writableEnded) {
      return IO.unit;
    } else if (request.method === "HEAD") {
      nodeResponse.writeHead(response.status, response.headers.toHeadersInit());
      nodeResponse.end();
      return IO.unit;
    }
    response.body.concrete();
    switch (response.body._tag) {
      case BodyTag.Empty: {
        nodeResponse.writeHead(response.status, response.headers.toHeadersInit());
        nodeResponse.end();
        return IO.unit;
      }
      case BodyTag.Raw: {
        nodeResponse.writeHead(response.status, response.headers.toHeadersInit());
        if (
          typeof response.body.body === "object" &&
          response.body.body !== null &&
          "pipe" in response.body.body &&
          typeof response.body.body.pipe === "function"
        ) {
          return IO.fromPromiseCatch(
            pipeline(response.body.body as any, nodeResponse, { end: true }),
            (error) => new ResponseError(request, response, "Decode", error),
          );
        }
        nodeResponse.end(response.body.body);
        return IO.unit;
      }
      case BodyTag.Uint8Array: {
        nodeResponse.writeHead(response.status, response.headers.toHeadersInit());
        nodeResponse.end(response.body.body);
        return IO.unit;
      }
      case BodyTag.FormData: {
        return IO.async<never, ResponseError, void>((resume) => {
          const r       = new Response((response.body as FormData).formData);
          const headers = {
            ...response.headers,
            ...Object.fromEntries(r.headers as any),
          };
          nodeResponse.writeHead(response.status, headers as any);
          Readable.fromWeb(r.body as any)
            .pipe(nodeResponse)
            .on("error", (error) => {
              resume(IO.failNow(new ResponseError(request, response, "Decode", error)));
            })
            .once("finish", () => {
              resume(IO.unit);
            });
        });
      }
      case BodyTag.Stream: {
        nodeResponse.writeHead(response.status, response.headers.toHeadersInit());
        return response.body.stream
          .mapError((error) => new ResponseError(request, response, "Decode", error))
          .run(
            NodeStream.fromWritable(
              () => nodeResponse,
              (error) => new ResponseError(request, response, "Decode", error),
            ),
          );
      }
    }
  });
}
