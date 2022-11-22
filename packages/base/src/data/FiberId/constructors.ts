import { AtomicNumber } from "../../internal/AtomicNumber.js";
import { None, Runtime } from "./definition.js";

/**
 * @tsplus static fncts.FiberIdOps none
 */
export const none          = new None();
const _fiberCounter = new AtomicNumber(0);

/**
 * @tsplus static fncts.FiberIdOps unsafeMake
 */
export function unsafeMake(__tsplusTrace?: string): Runtime {
  return new Runtime(_fiberCounter.getAndIncrement(), new Date().getTime(), __tsplusTrace);
}

/**
 * @tsplus static fncts.FiberIdOps synthetic
 */
export const synthetic = new Runtime(-1, -1, undefined);
