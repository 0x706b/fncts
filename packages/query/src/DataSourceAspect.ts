export const DataSourceAspectTypeId = Symbol.for("fncts.query.DataSourceAspect");
export type DataSourceAspectTypeId = typeof DataSourceAspectTypeId;

export abstract class DataSourceAspect<R> {
  readonly [DataSourceAspectTypeId]: DataSourceAspectTypeId = DataSourceAspectTypeId;
  abstract apply<R1, A>(dataSource: DataSource<R1, A>): DataSource<R | R1, A>;
}
