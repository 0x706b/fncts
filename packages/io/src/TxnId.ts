import { AtomicNumber } from "@fncts/base/internal/AtomicNumber";

export type TxnId = number;

/**
 * @tsplus type fncts.TxnIdOps
 */
export interface TxnIdOps {}

export const TxnId: TxnIdOps = {};

const txnCounter = new AtomicNumber(0);

/**
 * @tsplus static fncts.TxnIdOps make
 */
export function make(): TxnId {
  return txnCounter.incrementAndGet();
}
