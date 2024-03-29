import { PSynchronizedInternal } from "@fncts/io/Ref";
import { Stream } from "@fncts/io/Stream";

export const SubscriptionRefTypeId = Symbol.for("fncts.io.SubscriptionRef");
export type SubscriptionRefTypeId = typeof SubscriptionRefTypeId;

export class SubscriptionRefInternal<A> extends PSynchronizedInternal<never, never, never, never, A, A> {
  readonly [SubscriptionRefTypeId]: SubscriptionRefTypeId = SubscriptionRefTypeId;
  constructor(
    readonly semaphore: Semaphore,
    readonly hub: Hub<A>,
    readonly ref: Ref<A>,
  ) {
    super(semaphore, ref.get, (a) => ref.set(a));
  }
  changes: Stream<never, never, A> = Stream.unwrapScoped(
    this.withPermit(
      this.unsafeGet.flatMap((a) =>
        Stream.fromHubScoped(this.hub).map((stream) => Stream.succeedNow(a).concat(stream)),
      ),
    ),
  );
  set(a: A, __tsplusTrace?: string): UIO<void> {
    return this.withPermit(this.unsafeSet(a) < this.hub.publish(a));
  }
  modifyIO<R1, E1, B>(f: (a: A) => IO<R1, E1, readonly [B, A]>, __tsplusTrace?: string): IO<R1, E1, B> {
    return this.withPermit(
      this.unsafeGet.flatMap(f).flatMap(([b, a]) => this.unsafeSet(a).as(b) < this.hub.publish(a)),
    );
  }
}

/**
 * @tsplus type fncts.io.SubscriptionRef
 */
export interface SubscriptionRef<A> extends PRef.Synchronized<never, never, never, never, A, A> {
  readonly [SubscriptionRefTypeId]: SubscriptionRefTypeId;
}

/**
 * @tsplus type fncts.io.SubscriptionRefOps
 */
export interface SubscriptionRefOps {}

export const SubscriptionRef: SubscriptionRefOps = {};

export function concrete<A>(_: SubscriptionRef<A>): asserts _ is SubscriptionRefInternal<A> {
  //
}

/**
 * @tsplus static fncts.io.SubscriptionRefOps make
 * @tsplus static fncts.io.SubscriptionRefOps __call
 */
export function make<A>(value: Lazy<A>): UIO<SubscriptionRef<A>> {
  return Do((Δ) => {
    const semaphore = Δ(Semaphore(1));
    const hub       = Δ(Hub.makeUnbounded<A>());
    const ref       = Δ(Ref.make(value));
    return new SubscriptionRefInternal(semaphore, hub, ref);
  });
}
