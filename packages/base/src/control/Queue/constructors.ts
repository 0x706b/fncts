import type { UIO } from "../IO";
import type { UQueue } from "./definition";

import { bounded, unbounded } from "../../internal/MutableQueue";
import { IO } from "../IO";
import { _makeQueue } from "./internal";
import {
  BackPressureStrategy,
  DroppingStrategy,
  SlidingStrategy,
} from "./strategy";

/**
 * @tsplus static fncts.control.QueueOps makeSliding
 */
export function makeSliding<A>(capacity: number): UIO<UQueue<A>> {
  return IO.succeed(bounded<A>(capacity)).chain(
    _makeQueue(new SlidingStrategy())
  );
}

/**
 * @tsplus static fncts.control.QueueOps makeUnbounded
 */
export function makeUnbounded<A>(): UIO<UQueue<A>> {
  return IO.succeed(unbounded<A>()).chain(_makeQueue(new DroppingStrategy()));
}

/**
 * @tsplus static fncts.control.QueueOps makeDropping
 */
export function makeDropping<A>(capacity: number): UIO<UQueue<A>> {
  return IO.succeed(bounded<A>(capacity)).chain(
    _makeQueue(new DroppingStrategy())
  );
}

/**
 * @tsplus static fncts.control.QueueOps makeBounded
 */
export function makeBounded<A>(capacity: number): UIO<UQueue<A>> {
  return IO.succeed(bounded<A>(capacity)).chain(
    _makeQueue(new BackPressureStrategy())
  );
}
