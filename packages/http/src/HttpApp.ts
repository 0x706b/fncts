import type { ServerResponse } from "./ServerResponse.js";
import type { ResponseError } from "@fncts/http/ResponseError";

import { Vector } from "@fncts/base/collection/immutable/Vector";
import { globalValue } from "@fncts/base/data/Global";
import { defaultRuntime, type Runtime } from "@fncts/io/IO";

import { clientAbortFiberId } from "./ServerError.js";
import { ServerRequest } from "./ServerRequest.js";

/**
 * @tsplus type fncts.http.HttpApp
 */
export interface HttpApp<R, E, A> extends IO<R | ServerRequest, E, A> {}

/**
 * @tsplus type fncts.http.HttpAppOps
 */
export interface HttpAppOps {}

export const HttpApp: HttpAppOps = {};

export declare namespace HttpApp {
  export type Default<R, E> = HttpApp<R, E, ServerResponse>;
}

export type PreResponseHandler = (
  request: ServerRequest,
  response: ServerResponse,
) => FIO<ResponseError, ServerResponse>;

/**
 * @tsplus static fncts.http.HttpAppOps currentPreResponseHandlers
 */
export const currentPreResponseHandlers = globalValue(Symbol.for("fncts.http.HttpApp.currentPreResponseHandlers"), () =>
  FiberRef.unsafeMake<Vector<PreResponseHandler>>(Vector.empty()),
);

function noopHandler(_request: ServerRequest, response: ServerResponse): FIO<ResponseError, ServerResponse> {
  return IO.succeedNow(response);
}

/**
 * @tsplus static fncts.http.HttpAppOps preResponseHandler
 */
export const preResponseHandler: UIO<PreResponseHandler> = currentPreResponseHandlers.get.map(
  (handlers): PreResponseHandler =>
    handlers.foldLeft(
      noopHandler,
      (acc, handler) =>
        function (request, response) {
          return acc(request, response).flatMap((response) => handler(request, response));
        },
    ),
);

/**
 * @tsplus static fncts.http.HttpAppOps appendPreResponseHandler
 */
export function appendPreResponseHandler(handler: PreResponseHandler): UIO<void> {
  return HttpApp.currentPreResponseHandlers.update((handlers) => handlers.append(handler));
}

/**
 * @tsplus pipeable fncts.http.HttpApp withPreResponseHandler
 */
export function withPreResponseHandler(handler: PreResponseHandler) {
  return <R, E, A>(self: HttpApp<R, E, A>): HttpApp<R, E, A> =>
    HttpApp.currentPreResponseHandlers.locallyWith((handlers) => handlers.append(handler))(self);
}

export function toWebHandlerRuntime<R>(runtime: Runtime<R>) {
  const run = runtime.unsafeRunFiber;
  return <E>(self: HttpApp.Default<R | Scope, E>) => {
    return (request: Request): Promise<Response> =>
      new Promise((resolve, reject) => {
        const req   = ServerRequest.fromWeb(request);
        const fiber = run(
          self.provideSomeService(req, ServerRequest.Tag).map((res) => res.toWeb(req.method === "HEAD")).scoped,
        );
        request.signal.addEventListener("abort", () => {
          fiber.interruptAsFork(clientAbortFiberId);
        });
        fiber.addObserver((exit) => {
          exit.match(
            (cause) => {
              if (cause.isInterruptedOnly) {
                resolve(new Response(null, { status: request.signal.aborted ? 499 : 503 }));
              } else {
                reject(cause.prettyPrint);
              }
            },
            (response) => {
              resolve(response);
            },
          );
        });
      });
  };
}

export function toWebHandler<E>(self: HttpApp.Default<Scope, E>): (request: Request) => Promise<Response> {
  return toWebHandlerRuntime(defaultRuntime)(self);
}
