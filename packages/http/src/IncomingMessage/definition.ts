import type { Headers } from "../Headers.js";
import type { UrlParams } from "../UrlParams.js";

export const IncomingMessageTypeId = Symbol.for("fncts.http.IncomingMessage");
export type IncomingMessageTypeId = typeof IncomingMessageTypeId;

/**
 * @tsplus type fncts.http.IncomingMessage
 * @tsplus companion fncts.http.IncomingMessageOps
 */
export abstract class IncomingMessage<E> {
  readonly [IncomingMessageTypeId]: IncomingMessageTypeId = IncomingMessageTypeId;
  abstract readonly headers: Headers;
  abstract readonly remoteAddress: Maybe<string>;
  abstract readonly json: IO<never, E, unknown>;
  abstract readonly text: IO<never, E, string>;
  abstract readonly urlParamsBody: IO<never, E, UrlParams>;
  abstract readonly arrayBuffer: IO<never, E, ArrayBuffer>;
  abstract readonly stream: Stream<never, E, Uint8Array>;
}
