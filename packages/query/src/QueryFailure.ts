import type { Request } from "@fncts/query/Request";

import { show } from "@fncts/base/data/Showable";

export class QueryFailure extends Error {
  constructor(
    readonly dataSource: DataSource<any, any>,
    request: Request<any, any>,
  ) {
    super(`Data source ${dataSource.identifier} did not complete request ${show(request)}.`);
  }
}
