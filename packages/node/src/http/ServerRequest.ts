import type { Headers } from "@fncts/http/Headers";
import type { Method } from "@fncts/http/Method";
import type { ServerRequest } from "@fncts/http/ServerRequest";
import type { Socket } from "@fncts/http/Socket";
import type * as Http from "node:http";

import { RequestError } from "@fncts/http/RequestError";
import { ServerRequestTypeId } from "@fncts/http/ServerRequest";
import { IncomingMessageImpl } from "@fncts/node/http/IncomingMessage";

export class ServerRequestImpl extends IncomingMessageImpl<RequestError> implements ServerRequest {
  readonly [ServerRequestTypeId]: ServerRequestTypeId = ServerRequestTypeId;
  constructor(
    readonly source: Http.IncomingMessage,
    readonly response: Http.ServerResponse | Lazy<Http.ServerResponse>,
    private upgradeEffect?: IO<never, RequestError, Socket>,
    readonly url = source.url!,
    private headersOverride?: Headers,
    remoteAddressOverride?: string,
  ) {
    super(source, (error) => new RequestError(this, "Decode", error), remoteAddressOverride);
  }

  get resolvedResponse(): Http.ServerResponse {
    return typeof this.response === "function" ? this.response() : this.response;
  }

  modify(options: {
    readonly url?: string | undefined;
    readonly headers?: Headers | undefined;
    readonly remoteAddress?: string | undefined;
  }): ServerRequest {
    return new ServerRequestImpl(
      this.source,
      this.response,
      this.upgradeEffect,
      options.url ?? this.url,
      options.headers ?? this.headersOverride,
      options.remoteAddress ?? this.remoteAddressOverride,
    );
  }

  get originalUrl(): string {
    return this.source.url!;
  }

  get method(): Method {
    return this.source.method!.toUpperCase() as Method;
  }

  get upgrade(): IO<never, RequestError, Socket> {
    return this.upgradeEffect ?? IO.failNow(new RequestError(this, "Decode", "Not an upgradeable ServerRequest"));
  }
}
