import type { Either } from "../../../data/Either";
import type { Lazy } from "../../../data/function";
import type { Maybe } from "../../../data/Maybe";
import type { Has } from "../../../prelude";
import type { Schedule } from "../../Schedule";

import { Clock } from "../../Clock";
import { IO } from "../definition";

/**
 * @tsplus getter fncts.control.IO repeat
 */
export function repeat_<R, E, A>(self: IO<R, E, A>) {
  return <R1, B>(schedule0: Lazy<Schedule<R1, A, B>>, __tsplusTrace?: string): IO<Has<Clock> & R & R1, E, B> =>
    self.repeatOrElse(schedule0, (e, _) => IO.fail(e));
}

/**
 * @tsplus getter fncts.control.IO repeatOrElse
 */
export function repeatOrElse_<R, E, A>(self: IO<R, E, A>) {
  return <R1, B, R2, E2>(
    schedule0: Lazy<Schedule<R1, A, B>>,
    orElse: (e: E, out: Maybe<B>) => IO<R2, E2, B>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, B> => self.repeatOrElseEither(schedule0, orElse).map((_) => _.value);
}

/**
 * @tsplus getter fncts.control.IO repeatOrElseEither
 */
export function repeatOrElseEither_<R, E, A>(self: IO<R, E, A>) {
  return <R1, B, R2, E2, C>(
    schedule0: Lazy<Schedule<R1, A, B>>,
    orElse: (e: E, out: Maybe<B>) => IO<R2, E2, C>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, Either<C, B>> =>
    IO.asksServiceIO(Clock.Tag)((clock) => clock.repeatOrElseEither(self)(schedule0, orElse));
}
