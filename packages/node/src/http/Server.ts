import type { FormData } from "@fncts/http/Body";
import type { ServerResponse } from "@fncts/http/ServerResponse";
import type * as Http from "node:http";
import type * as Net from "node:net";

import { BodyTag } from "@fncts/http/Body";
import { HttpApp } from "@fncts/http/HttpApp";
import { Middleware } from "@fncts/http/Middleware";
import { ResponseError } from "@fncts/http/ResponseError";
import { Server } from "@fncts/http/Server";
import { clientAbortFiberId, ServeError } from "@fncts/http/ServerError";
import { ServerRequest } from "@fncts/http/ServerRequest";
import { ServerRequestImpl } from "@fncts/node/http/ServerRequest";
import * as NodeStream from "@fncts/node/stream";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export function make(evaluate: Lazy<Http.Server>, options: Net.ListenOptions): IO<Scope, ServeError, Server> {
  return Do((Δ) => {
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
          const handler = Δ(makeHandler(httpApp, middleware!));
          Δ(
            IO.addFinalizer(
              IO(() => {
                server.off("request", handler);
              }),
            ),
          );
          Δ(IO(server.on("request", handler)));
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
  const handledApp = (middleware ? middleware(respond(httpApp)) : respond(httpApp)).scoped;
  // @ts-expect-error
  return IO.runtime<R>().map((runtime) => {
    const run = runtime.unsafeRunFiber;
    return function handler(nodeRequest, nodeResponse) {
      const fiber = run(
        handledApp.provideSomeService(new ServerRequestImpl(nodeRequest, nodeResponse), ServerRequest.Tag),
      );
      nodeResponse.on("close", () => {
        if (!nodeResponse.writableEnded) {
          if (!nodeResponse.headersSent) {
            nodeResponse.writeHead(499);
          }
          nodeResponse.end();
          run(fiber.interruptAsFork(clientAbortFiberId));
        }
      });
    };
  });
}

export const respond = Middleware((httpApp) => {
  return IO.uninterruptibleMask((restore) =>
    IO.service(ServerRequest.Tag).flatMap((request) =>
      restore(
        httpApp
          .flatMap((response) => HttpApp.preResponseHandler.flatMap((f) => f(request, response)))
          .tap((response) => handleResponse(request, response)),
      ).tapErrorCause((cause) =>
        IO(() => {
          const nodeResponse = (request as ServerRequestImpl).resolvedResponse;
          if (!nodeResponse.headersSent) {
            nodeResponse.writeHead(cause.isInterruptedOnly ? 503 : 500);
          }
          if (!nodeResponse.writableEnded) {
            nodeResponse.end();
          }
        }),
      ),
    ),
  );
});

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
