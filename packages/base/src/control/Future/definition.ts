/**
 * @tsplus type fncts.control.Future
 * @tsplus companion fncts.control.FutureOps
 */
export class Future<E, A> {
  constructor(public state: State<E, A>, readonly blockingOn: FiberId) {}
}

export const enum FutureStateTag {
  Done = "Done",
  Pending = "Pending",
}

export class Pending<E, A> {
  readonly _tag = FutureStateTag.Pending;
  constructor(readonly joiners: List<(_: FIO<E, A>) => void>) {}
}

export class Done<E, A> {
  readonly _tag = FutureStateTag.Done;
  constructor(readonly value: FIO<E, A>) {}
}

export type State<E, A> = Done<E, A> | Pending<E, A>;
