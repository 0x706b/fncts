import type { Method } from "../Method.js";
import type { PathInput } from "./definition";

import { Route, RouteContext } from "./definition.js";

export class RouteImpl<R, E> extends Route<R, E> {
  constructor(
    readonly method: Method | "*",
    readonly path: PathInput,
    readonly handler: Route.Handler<R, E>,
    readonly prefix: Maybe<string> = Nothing(),
  ) {
    super();
  }
}

export class RouteContextImpl extends RouteContext {
  constructor(
    readonly route: Route<unknown, unknown>,
    readonly params: Readonly<Record<string, string | undefined>>,
    readonly searchParams: Readonly<Record<string, string>>,
  ) {
    super();
  }
}
