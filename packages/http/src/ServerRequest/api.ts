import type { ServerRequest } from "./definition.js";

import { ServerRequestImpl } from "./internal.js";

/**
 * @tsplus static fncts.http.ServerRequestOps fromWeb
 */
export function fromWeb(request: globalThis.Request): ServerRequest {
  return new ServerRequestImpl(request, request.url);
}
