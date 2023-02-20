import type { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";

import { ExitTag } from "@fncts/base/data/Exit";
import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";

/**
 * @tsplus pipeable fncts.io.IO raceFibersWith
 */
export function raceFibersWith<R, E, A, R1, E1, B, R2, E2, C, R3, E3, D>(
  right: Lazy<IO<R1, E1, B>>,
  leftWins: (winner: FiberRuntime<E, A>, loser: FiberRuntime<E1, B>) => IO<R2, E2, C>,
  rightWins: (winner: FiberRuntime<E1, B>, loser: FiberRuntime<E, A>) => IO<R3, E3, D>,
  __tsplusTrace?: string,
) {
  return (left: IO<R, E, A>): IO<R | R1 | R2 | R3, E2 | E3, C | D> => {
    return IO.withFiberRuntime((parentState, parentStatus) => {
      const right0             = right();
      const parentRuntimeFlags = parentStatus.runtimeFlags;
      function complete<E0, E1, A, B, R2, E2, C>(
        winner: FiberRuntime<E0, A>,
        loser: FiberRuntime<E1, B>,
        cont: (winner: FiberRuntime<E0, A>, loser: FiberRuntime<E1, B>) => IO<R2, E2, C>,
        ab: AtomicBoolean,
        cb: (_: IO<R2, E2, C>) => any,
      ): any {
        if (ab.compareAndSet(true, false)) {
          cb(cont(winner, loser));
        }
      }

      const raceIndicator = new AtomicBoolean(true);
      const leftFiber     = IO.unsafeMakeChildFiber(left, parentState, parentRuntimeFlags, null, __tsplusTrace);
      const rightFiber    = IO.unsafeMakeChildFiber(right0, parentState, parentRuntimeFlags, null, __tsplusTrace);

      return IO.async((cb) => {
        leftFiber.addObserver(() => complete(leftFiber, rightFiber, leftWins, raceIndicator, cb));
        rightFiber.addObserver(() => complete(rightFiber, leftFiber, rightWins, raceIndicator, cb));
        leftFiber.startFork(left);
        rightFiber.startFork(right0);
      }, leftFiber.fiberId.combine(rightFiber.fiberId));
    });
  };
}

/**
 * Returns an effect that races this effect with the specified effect, calling
 * the specified finisher as soon as one result or the other has been computed.
 *
 * @tsplus pipeable fncts.io.IO raceWith
 */
export function raceWith<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3>(
  right: Lazy<IO<R1, E1, A1>>,
  leftWins: (exit: Exit<E, A>, fiber: Fiber<E1, A1>) => IO<R2, E2, A2>,
  rightWins: (exit: Exit<E1, A1>, fiber: Fiber<E, A>) => IO<R3, E3, A3>,
  __tsplusTrace?: string,
) {
  return (left: IO<R, E, A>): IO<R | R1 | R2 | R3, E2 | E3, A2 | A3> => {
    return left.raceFibersWith(
      right,
      (winner, loser) =>
        winner.await.flatMap((exit) => {
          switch (exit._tag) {
            case ExitTag.Success:
              return winner.inheritAll.flatMap(() => leftWins(exit, loser));
            case ExitTag.Failure:
              return leftWins(exit, loser);
          }
        }),
      (winner, loser) =>
        winner.await.flatMap((exit) => {
          switch (exit._tag) {
            case ExitTag.Success:
              return winner.inheritAll.flatMap(() => rightWins(exit, loser));
            case ExitTag.Failure:
              return rightWins(exit, loser);
          }
        }),
    );
  };
}
