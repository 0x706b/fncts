/**
 * @tsplus type fncts.test.Sample
 * @tsplus companion fncts.test.SampleOps
 */
export class Sample<R, A> {
  constructor(
    readonly value: A,
    readonly shrink: Stream<R, never, Maybe<Sample<R, A>>>,
  ) {}
}
