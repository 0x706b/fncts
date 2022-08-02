import type { Decision } from "./Decision.js";
import type { Driver as Driver_ } from "./Driver.js";

/**
 * A `Schedule<Env, In, Out>` defines a recurring schedule, which consumes
 * values of type `In`, and which returns values of type `Out`.
 *
 * Schedules are defined as a possibly infinite set of intervals spread out over
 * time. Each interval defines a window in which recurrence is possible.
 *
 * When schedules are used to repeat or retry effects, the starting boundary of
 * each interval produced by a schedule is used as the moment when the effect
 * will be executed again.
 *
 * Schedules compose in the following primary ways:
 *
 * - Union. This performs the union of the intervals of two schedules.
 * - Intersection. This performs the intersection of the intervals of two
 * schedules.
 * - Sequence. This concatenates the intervals of one schedule onto
 * another.
 *
 * In addition, schedule inputs and outputs can be transformed, filtered (to
 * terminate a schedule early in response to some input or output), and so
 * forth.
 *
 * A variety of other operators exist for transforming and combining schedules,
 * and the companion object for `Schedule` contains all common types of
 * schedules, both for performing retrying, as well as performing repetition.
 *
 * @tsplus type fncts.io.Schedule
 * @tsplus companion fncts.io.ScheduleOps
 */
export abstract class Schedule<Env, In, Out> {
  readonly _Env!: () => Env;
  readonly _In!: (_: In) => void;
  readonly _Out!: () => Out;
  readonly _State!: unknown;

  abstract readonly initial: this["_State"];
  abstract step(
    now: number,
    inp: In,
    state: this["_State"],
    __tsplusTrace?: string,
  ): IO<Env, never, readonly [this["_State"], Out, Decision]>;
}

export declare namespace Schedule {
  /**
   * @tsplus type fncts.io.Schedule
   */
  export interface WithState<State, Env, In, Out> extends Schedule<Env, In, Out> {
    readonly _State: State;
  }

  export type StateOf<X> = [X] extends [Schedule<any, any, any>] ? X["_State"] : never;

  export type Driver<State, Env, In, Out> = Driver_<State, Env, In, Out>;
}
