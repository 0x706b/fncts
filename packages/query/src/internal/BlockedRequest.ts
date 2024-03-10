import type { Request } from "@fncts/query/Request";

export const BlockedRequestTypeId = Symbol.for("fncts.query.BlockedRequest");
export type BlockedRequestTypeId = typeof BlockedRequestTypeId;

/**
 * @tsplus type fncts.query.BlockedRequest
 * @tsplus companion fncts.query.BlockedRequestOps
 */
export class BlockedRequest<A> {
  readonly [BlockedRequestTypeId]: BlockedRequestTypeId = BlockedRequestTypeId;
  constructor(
    readonly request: Request<Request.ErrorOf<A>, Request.ValueOf<A>>,
    readonly result: Ref<Maybe<Either<Request.ErrorOf<A>, Request.ValueOf<A>>>>,
  ) {}
}

/**
 * @tsplus static fncts.query.BlockedRequestOps make
 */
export function make<A extends Request<any, any>>(
  request: A,
  result: Ref<Maybe<Either<Request.ErrorOf<A>, Request.ValueOf<A>>>>,
): BlockedRequest<A> {
  return new BlockedRequest(request, result);
}
