/**
 * @tsplus pipeable fncts.query.Query mapDataSources
 */
export function mapDataSources<R1>(f: DataSourceAspect<R1>) {
  return <R, E, A>(self: Query<R, E, A>): Query<R | R1, E, A> => {
    return new Query(self.step.map((result) => result.mapDataSources(f)))
  }
}
