import { AtomicNumber } from "../../internal/AtomicNumber";
import { None, Runtime } from "./definition";

/**
 * @tsplus static fncts.data.FiberIdOps none
 */
export const none = new None();

const _fiberCounter = new AtomicNumber(0);

/**
 * @tsplus static fncts.data.FiberIdOps newFiberId
 */
export function newFiberId(): Runtime {
  return new Runtime(_fiberCounter.getAndIncrement(), new Date().getTime());
}
