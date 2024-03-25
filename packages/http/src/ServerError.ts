import { Runtime } from "@fncts/base/data/FiberId";
import { globalValue } from "@fncts/base/data/Global";

export const clientAbortFiberId = globalValue("fncts.http.ServerError.clientAbortFiberId", () => new Runtime(-499, 0));

export const ServeErrorTypeId = Symbol.for("fncts.http.ServeError");
export type ServeErrorTypeId = typeof ServeErrorTypeId;

export class ServeError extends Error {
  readonly [ServeErrorTypeId]: ServeErrorTypeId = ServeErrorTypeId;
  constructor(readonly error?: unknown) {
    super();
  }
}
