import { AtomicNumber } from "../internal/AtomicNumber";

export type TxnId = number;

/**
 * @tsplus type fncts.data.TxnIdOps
 */
export interface TxnIdOps {}

export const TxnId: TxnIdOps = {};

const txnCounter = new AtomicNumber(0);

/**
 * @tsplus static fncts.data.TxnIdOps make
 */
export function make(): TxnId {
  return txnCounter.incrementAndGet();
}
