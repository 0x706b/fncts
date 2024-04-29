import type { AsyncInputProducer } from "@fncts/io/Channel/internal/AsyncInputProducer";

import { CauseTag } from "@fncts/base/data/Cause";
import { WebSocket as IsoWs } from "isows";

export const SocketTypeId = Symbol.for("fncts.http.Socket");
export type SocketTypeId = typeof SocketTypeId;

/**
 * @tsplus type fncts.http.Socket
 * @tsplus companion fncts.http.SocketOps
 */
export abstract class Socket {
  readonly [SocketTypeId]: SocketTypeId = SocketTypeId;
  abstract run<R, E, A>(handler: (_: Uint8Array) => IO<R, E, A>): IO<R, E | SocketError, void>;
  abstract writer: IO<Scope, never, (chunk: Uint8Array | CloseEvent) => UIO<void>>;
}

/**
 * @tsplus static fncts.http.SocketOps Tag
 */
export const SocketTag = Tag<Socket>();

export const SocketGenericErrorTypeId = Symbol.for("fncts.http.Socket.SocketGenericError");
export type SocketGenericErrorTypeId = typeof SocketGenericErrorTypeId;

export class SocketGenericError extends Error {
  readonly [SocketGenericErrorTypeId]: SocketGenericErrorTypeId = SocketGenericErrorTypeId;
  constructor(
    readonly reason: "Write" | "Read" | "Open" | "OpenTimeout",
    readonly error: unknown,
  ) {
    super();
  }
}

export const SocketCloseErrorTypeId = Symbol.for("fncts.http.Socket.SocketCloseError");
export type SocketCloseErrorTypeId = typeof SocketCloseErrorTypeId;

export class SocketCloseError extends Error {
  readonly [SocketCloseErrorTypeId]: SocketCloseErrorTypeId = SocketCloseErrorTypeId;
  constructor(
    readonly reason: "Close",
    readonly code: number,
    readonly closeReason: string | undefined,
    readonly error: unknown,
  ) {
    super();
  }

  static isClean(isClean: (code: number) => boolean) {
    return (u: unknown): u is SocketCloseError => {
      return isSocketCloseError(u) && isClean(u.code);
    };
  }
}

export function isSocketCloseError(u: unknown): u is SocketCloseError {
  return isObject(u) && SocketCloseErrorTypeId in u;
}

export type SocketError = SocketGenericError | SocketCloseError;

export const CloseEventTypeId = Symbol.for("fncts.http.Socket.CloseEvent");
export type CloseEventTypeId = typeof CloseEventTypeId;

export class CloseEvent {
  readonly [CloseEventTypeId]: CloseEventTypeId = CloseEventTypeId;
  constructor(
    readonly code = 1000,
    readonly reason?: string,
  ) {}
}

export function isCloseEvent(u: unknown): u is CloseEvent {
  return isObject(u) && CloseEventTypeId in u;
}

/**
 * @tsplus fluent fncts.http.Socket toChannel
 */
export function toChannel<IE>(
  self: Socket,
): Channel<never, IE, Conc<Uint8Array | CloseEvent>, unknown, SocketError | IE, Conc<Uint8Array>, void> {
  return Channel.unwrap(
    Do((Δ) => {
      const writeScope = Δ(Scope.make);
      const write      = Δ(writeScope.extend(self.writer));
      const exitQueue  = Δ(Queue.makeUnbounded<Exit<SocketError | IE, Conc<Uint8Array>>>());

      const input: AsyncInputProducer<IE, Conc<Uint8Array | CloseEvent>, unknown> = {
        awaitRead: IO.unit,
        emit(chunk) {
          return IO.foreachDiscard(chunk, write).catchAllCause((cause) => exitQueue.offer(Exit.failCause(cause)));
        },
        error(error) {
          return writeScope.close(Exit.unit) > exitQueue.offer(Exit.failCause(error));
        },
        done() {
          return writeScope.close(Exit.unit);
        },
      };

      Δ(
        self
          .run((data) => exitQueue.offer(Exit.succeed(Conc.single(data))))
          .zipRight(IO.failCauseNow(Cause.empty<IE | SocketError>()))
          .result.tap((exit) => exitQueue.offer(exit)).fork.interruptible,
      );

      const loop: Channel<never, unknown, unknown, unknown, SocketError | IE, Conc<Uint8Array>, void> = Channel.fromIO(
        exitQueue.take,
      ).flatMap((exit) =>
        exit.match(
          (cause) => (cause._tag === CauseTag.Empty ? Channel.unit : Channel.failCause(cause)),
          (chunk) => Channel.write(chunk) > loop,
        ),
      );

      return loop.embedInput(input);
    }),
  );
}

/**
 * @tsplus fluent fncts.http.Socket toChannelWith
 */
export function toChannelWith<IE = never>(
  self: Socket,
): Channel<never, IE, Conc<Uint8Array | CloseEvent>, unknown, SocketError | IE, Conc<Uint8Array>, void> {
  return self.toChannel<IE>();
}

/**
 * @tsplus companion fncts.http.WebSocketOps
 */
export interface WebSocket {
  readonly _: unique symbol;
}

/**
 * @tsplus static fncts.http.WebSocketOps Tag
 */
export const WebSocketTag = Tag<WebSocket>();

/**
 * @tsplus static fncts.http.SocketOps makeWebSocket
 * @tsplus static fncts.http.WebSocketOps __call
 */
export function makeWebSocket(
  url: string,
  options?: {
    readonly closeCodeIsError?: (code: number) => boolean;
    readonly openTimeout?: Duration;
  },
): UIO<Socket> {
  return Socket.fromWebSocket(
    IO.acquireRelease(
      IO(() => {
        if ("WebSocket" in globalThis) {
          return new globalThis.WebSocket(url);
        }
        return new IsoWs(url);
      }),
      (ws) => IO(ws.close()),
    ),
    options,
  );
}

/**
 * @tsplus static fncts.http.SocketOps fromWebSocket
 */
export function fromWebSocket(
  acquire: IO<Scope, SocketError, globalThis.WebSocket>,
  options?: {
    readonly closeCodeIsError?: (code: number) => boolean;
    readonly openTimeout?: Duration;
  },
): UIO<Socket> {
  return Do((Δ) => {
    const closeCodeIsError = options?.closeCodeIsError ?? ((code) => code !== 1000 && code !== 1006);
    const sendQueue        = Δ(Queue.makeUnbounded<Uint8Array | CloseEvent>());
    const run              = <R, E>(handler: (_: Uint8Array) => IO<R, E, any>) =>
      Do((Δ) => {
        const ws       = Δ(acquire);
        const encoder  = new TextEncoder();
        const fiberSet = Δ(FiberSet.make<E | SocketError, any>());
        const run      = Δ(
          fiberSet.runtime<E | SocketError, any, R>().provideSomeService(ws as unknown as WebSocket, WebSocket.Tag),
        );
        let open     = false;
        ws.onmessage = (event) => {
          run(
            handler(
              event.data instanceof Uint8Array
                ? event.data
                : typeof event.data === "string"
                  ? encoder.encode(event.data)
                  : new Uint8Array(event.data),
            ),
          );
        };

        ws.onclose = (event) => {
          fiberSet.future.unsafeDone(IO.fail(new SocketCloseError("Close", event.code, event.reason, undefined)));
        };

        ws.onerror = (error) => {
          fiberSet.future.unsafeDone(IO.fail(new SocketGenericError(open ? "Read" : "Open", error)));
        };

        Δ(
          IO.defer(() => {
            if (ws.readyState !== 1) {
              return IO.async<never, SocketError, void>((resume) => {
                ws.onopen = () => {
                  resume(IO.unit);
                };
              })
                .timeoutFail(
                  options?.openTimeout ?? (10).seconds,
                  new SocketGenericError("OpenTimeout", 'timeout waiting for "open"'),
                )
                .raceFirst(fiberSet.join);
            }

            return IO.unit;
          }),
        );

        Δ(IO((open = true)));

        Δ(
          fiberSet.run(
            sendQueue.take.tap((chunk) => {
              if (isCloseEvent(chunk)) {
                return IO.fail(() => {
                  ws.close(chunk.code, chunk.reason);
                  return new SocketCloseError("Close", chunk.code, chunk.reason, chunk);
                });
              } else {
                return IO.tryCatch(ws.send(chunk), (error) => new SocketGenericError("Write", error));
              }
            }).forever,
          ),
        );

        Δ(
          fiberSet.join.catchJust(
            Maybe.partial(
              (miss) => (error) =>
                SocketCloseError.isClean((code) => !closeCodeIsError(code))(error) ? IO.unit : miss(),
            ),
          ),
        );
      }).scoped.interruptible;

    const write = (chunk: Uint8Array | CloseEvent) => sendQueue.offer(chunk);

    const writer = IO(() => write);

    return new (class extends Socket {
      writer = writer;
      run = run;
    })();
  });
}

/**
 * @tsplus static fncts.http.SocketOps makeWebSocketChannel
 * @tsplus static fncts.http.WebSocketOps makeChannel
 */
export function makeWebSocketChannel<IE = never>(
  url: string,
  options?: {
    readonly closeCodeIsError?: (code: number) => boolean;
  },
): Channel<never, IE, Conc<Uint8Array>, unknown, IE | SocketError, Conc<Uint8Array | string | CloseEvent>, void> {
  return Channel.unwrap(makeWebSocket(url, options).map((socket) => socket.toChannel<IE>()));
}

/**
 * @tsplus static fncts.http.SocketOps liveWebSocket
 * @tsplus static fncts.http.WebSocketOps live
 */
export function live(
  url: string,
  options?: {
    readonly closeCodeIsError?: (code: number) => boolean;
  },
): Layer<never, never, Socket> {
  return Layer.scoped(WebSocket(url, options), Socket.Tag);
}
