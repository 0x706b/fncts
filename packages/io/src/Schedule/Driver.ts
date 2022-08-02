/**
 * @tsplus type fncts.io.Schedule.Driver
 * @tsplus companion fncts.io.Schedule.DriverOps
 */
export class Driver<State, Env, In, Out> {
  constructor(
    readonly next: (inp: In, __tsplusTrace?: string) => IO<Env, Nothing, Out>,
    readonly last: IO<never, NoSuchElementError, Out>,
    readonly reset: UIO<void>,
    readonly state: UIO<State>,
  ) {}
}

/**
 * @tsplus static fncts.io.Schedule.DriverOps __call
 */
export function makeDriver<State, Env, In, Out>(
  next: (inp: In, __tsplusTrace?: string) => IO<Env, Nothing, Out>,
  last: IO<never, NoSuchElementError, Out>,
  reset: UIO<void>,
  state: UIO<State>,
): Driver<State, Env, In, Out> {
  return new Driver(next, last, reset, state);
}
