import type { AsyncInputProducer } from "@fncts/io/Channel/internal/AsyncInputProducer";

import { CauseTag } from "@fncts/base/data/Cause";

export const SocketTypeId = Symbol.for("fncts.http.Socket");
export type SocketTypeId = typeof SocketTypeId;

export abstract class Socket {
  readonly [SocketTypeId]: SocketTypeId = SocketTypeId;
  abstract run<R, E, A>(handler: (_: Uint8Array) => IO<R, E, A>): IO<R, E | SocketError, void>;
  abstract writer: IO<Scope, never, (chunk: Uint8Array | CloseEvent) => UIO<void>>;
}

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

/**
 * @tsplus getter fncts.http.Socket toChannel
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
