/**
 * @tsplus type fncts.test.control.Sample
 * @tsplus companion fncts.test.control.SampleOps
 */
export class Sample<R, A> {
  constructor(readonly value: A, readonly shrink: Stream<R, never, Maybe<Sample<R, A>>>) {}
}
