import type { Result } from "@fncts/query/internal/Result";

export const QueryTypeId = Symbol.for("fncts.query.Query");
export type QueryTypeId = typeof QueryTypeId;

/**
 * @tsplus type fncts.query.Query
 * @tsplus companion fncts.query.QueryOps
 */
export class Query<R, E, A> {
  readonly [QueryTypeId]: QueryTypeId = QueryTypeId;
  constructor(readonly step: IO<R, never, Result<R, E, A>>) {}
}
