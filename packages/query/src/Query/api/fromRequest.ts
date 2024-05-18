import type { Request } from "@fncts/query/Request";

import { BlockedRequest } from "@fncts/query/internal/BlockedRequest";
import { BlockedRequests } from "@fncts/query/internal/BlockedRequests";

/**
 * @tsplus static fncts.query.QueryOps fromRequest
 */
export function fromRequest<R, A extends Request<any, any>>(
  request0: Lazy<A>,
  dataSource0: Lazy<DataSource<R, A>>,
  __tsplusTrace?: string,
): Query<R, Request.ErrorOf<A>, Request.ValueOf<A>> {
  return new Query(
    IO.defer(() => {
      const request    = request0();
      const dataSource = dataSource0();
      return Query.cachingEnabled.get.flatMap((cachingEnabled) => {
        if (cachingEnabled) {
          return Query.currentCache.get.flatMap((cache) =>
            cache.lookup(request).flatMap((r) =>
              r.match(
                (ref) =>
                  IO.succeedNow(
                    Result.blocked(
                      BlockedRequests.single(dataSource, BlockedRequest.make(request, ref)),
                      Continue(request, dataSource, ref),
                    ),
                  ),
                (ref) =>
                  ref.get.map((r) =>
                    r.match(
                      () => Result.blocked(BlockedRequests.empty(), Continue(request, dataSource, ref)),
                      (b) => Result.fromEither(b),
                    ),
                  ),
              ),
            ),
          );
        } else {
          return Ref.make(Nothing<Either<Request.ErrorOf<A>, Request.ValueOf<A>>>()).map((ref) =>
            Result.blocked(
              BlockedRequests.single(dataSource, BlockedRequest.make(request, ref)),
              Continue(request, dataSource, ref),
            ),
          );
        }
      });
    }),
  );
}
