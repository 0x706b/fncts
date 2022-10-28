export function withCountdownLatch<R, E, A, R1, E1, B>(
  n: number,
  f: (latch: CountdownLatch) => IO<R, E, A>,
  onEnd: IO<R1, E1, B>,
): IO<R | R1, E | E1, B> {
  return Do((Δ) => {
    const latch = Δ(CountdownLatch(n));
    Δ(f(latch));
    return Δ(latch.await > onEnd);
  });
}

export const EarlyExitTypeId = Symbol.for("fncts.io.Push.EarlyExit");
export type EarlyExitTypeId = typeof EarlyExitTypeId;

export class EarlyExit {
  readonly _typeId: EarlyExitTypeId = EarlyExitTypeId;
}

export function isEarlyExit(u: unknown): u is EarlyExit {
  return hasTypeId(u, EarlyExitTypeId);
}

export const earlyExit = IO.haltNow(new EarlyExit());
