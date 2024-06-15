import type { IncomingMessage } from "./definition.js";

/**
 * @tsplus pipeable fncts.http.IncomingMessage schemaBodyJson
 */
export function schemaBodyJson<A>(schema: Schema<A>) {
  const decode = schema.decode;
  return <E>(self: IncomingMessage<E>): IO<never, E | ParseError, A> => self.json.flatMap(decode);
}

/**
 * @tsplus pipeable fncts.http.IncomingMessage schemaBodyUrlParams
 */
export function schemaBodyUrlParams<A>(schema: Schema<A>) {
  const decode = schema.decode;
  return <E>(self: IncomingMessage<E>): IO<never, E | ParseError, A> => self.urlParamsBody.flatMap(decode);
}

/**
 * @tsplus pipeable fncts.http.IncomingMessage schemaHeaders
 */
export function schemaHeaders<A>(schema: Schema<A>) {
  const decode = schema.decode;
  return <E>(self: IncomingMessage<E>): IO<never, E | ParseError, A> => decode(self.headers);
}
