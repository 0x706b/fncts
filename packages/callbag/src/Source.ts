import type { Signal } from "@fncts/callbag/Signal";
import type { Sink } from "@fncts/callbag/Sink";

/**
 * @tsplus type fncts.callbag.Source
 */
export type Source<E, A> = (signal: Signal.Start, sink: Sink<E, any, A>) => void;

/**
 * @tsplus type fncts.callbag.SourceOps
 */
export interface SourceOps {}

export const Source: SourceOps = {};
