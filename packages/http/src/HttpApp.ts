import type { Middleware } from "./Middleware.js";
import type { ServerResponse } from "./ServerResponse.js";
import type { ResponseError } from "@fncts/http/ResponseError";

import { globalValue } from "@fncts/base/data/Global";
import { defaultRuntime, type Runtime } from "@fncts/io/IO";

import { clientAbortFiberId } from "./ServerError.js";
import { ServerRequest } from "./ServerRequest.js";
import { isServerResponse } from "./ServerResponse.js";

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

/**
 * @tsplus pipeable fncts.http.HttpApp toHandled
 */
export function toHandled<E, RH>(
  handleResponse: (request: ServerRequest, exit: Exit<E | ResponseError, ServerResponse>) => IO<RH, never, any>,
  middleware?: Middleware,
) {
  return <R>(self: HttpApp.Default<R, E>): HttpApp.Default<Exclude<R | RH, Scope>, E | ResponseError> => {
    const responded = IO.withFiberRuntime<R | RH | ServerRequest, E | ResponseError, ServerResponse>((fiber) => {
      const request    = fiber.getFiberRef(FiberRef.currentEnvironment).unsafeGet(ServerRequest.Tag);
      const handler    = fiber.getFiberRef(HttpApp.currentPreResponseHandlers);
      const preHandled = handler.match(
        () => self,
        (handler) => self.flatMap((response) => handler(request, response)),
      );
      return preHandled.result.flatMap((exit) => {
        if (exit.isFailure()) {
          const haltMaybe = exit.cause.haltMaybe;
          if (haltMaybe.isJust() && isServerResponse(haltMaybe.value)) {
            exit = Exit.succeed(haltMaybe.value);
          }
        }
        return handleResponse(request, exit) > exit;
      });
    });

    return (middleware ? middleware(responded) : responded).scoped.uninterruptible;
  };
}

export type PreResponseHandler = (
  request: ServerRequest,
  response: ServerResponse,
) => FIO<ResponseError, ServerResponse>;

/**
 * @tsplus static fncts.http.HttpAppOps currentPreResponseHandlers
 */
export const currentPreResponseHandlers = globalValue(Symbol.for("fncts.http.HttpApp.currentPreResponseHandlers"), () =>
  FiberRef.unsafeMake<Maybe<PreResponseHandler>>(Nothing()),
);

/**
 * @tsplus static fncts.http.HttpAppOps appendPreResponseHandler
 */
export function appendPreResponseHandler(handler: PreResponseHandler): UIO<void> {
  return HttpApp.currentPreResponseHandlers.update((handlers) =>
    handlers.match(
      () => Just(handler),
      (prev) => Just((request, response) => prev(request, response).flatMap((response) => handler(request, response))),
    ),
  );
}

/**
 * @tsplus pipeable fncts.http.HttpApp withPreResponseHandler
 */
export function withPreResponseHandler(handler: PreResponseHandler) {
  return <R, E, A>(self: HttpApp<R, E, A>): HttpApp<R, E, A> =>
    HttpApp.currentPreResponseHandlers.locallyWith((handlers) =>
      handlers.match(
        () => Just(handler),
        (prev) =>
          Just((request, response) => prev(request, response).flatMap((response) => handler(request, response))),
      ),
    )(self);
}

export function toWebHandlerRuntime<R>(runtime: Runtime<R>) {
  const run           = runtime.unsafeRunFiber;
  const resolveSymbol = Symbol();
  const rejectSymbol  = Symbol();
  return <E>(self: HttpApp.Default<R | Scope, E>) => {
    const handled = self.toHandled((request, exit) => {
      const webRequest = request.source as Request;
      if (exit.isSuccess()) {
        (request as any)[resolveSymbol](exit.value.toWeb(request.method === "HEAD"));
      } else if (exit.cause.isInterruptedOnly) {
        (request as any)[resolveSymbol](new Response(null, { status: webRequest.signal.aborted ? 499 : 503 }));
      } else {
        (request as any)[rejectSymbol](exit.cause.prettyPrint);
      }
      return IO.unit;
    });
    return (request: Request): Promise<Response> =>
      new Promise((resolve, reject) => {
        const req                   = ServerRequest.fromWeb(request);
        (req as any)[resolveSymbol] = resolve;
        (req as any)[rejectSymbol]  = reject;
        const fiber                 = run(
          self.provideSomeService(req, ServerRequest.Tag).map((res) => res.toWeb(req.method === "HEAD")).scoped,
        );
        request.signal.addEventListener("abort", () => {
          fiber.interruptAsFork(clientAbortFiberId);
        });
      });
  };
}

export function toWebHandler<E>(self: HttpApp.Default<Scope, E>): (request: Request) => Promise<Response> {
  return toWebHandlerRuntime(defaultRuntime)(self);
}
