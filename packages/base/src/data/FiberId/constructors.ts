import { AtomicNumber } from "../../internal/AtomicNumber.js";
import { None, Runtime } from "./definition.js";

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

export const synthetic = new Runtime(-1, -1);
