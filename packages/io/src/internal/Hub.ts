export declare namespace Hub {
  export type Subscription<A> = SubscriptionInternal<A>;
}

/**
 * @tsplus type fncts.internal.Hub.Subscription
 * @tsplus companion fncts.internal.Hub.SubscriptionOps
 */
export abstract class SubscriptionInternal<A> {
  abstract isEmpty(): boolean;
  abstract poll(def: A): A;
  abstract pollUpTo(n: number): Conc<A>;
  abstract size(): number;
  abstract unsubscribe(): void;
}

/**
 * @tsplus type fncts.internal.Hub
 * @tsplus companion fncts.internal.Hub
 */
export abstract class Hub<A> {
  abstract readonly capacity: number;
  abstract isEmpty(): boolean;
  abstract isFull(): boolean;
  abstract publish(a: A): boolean;
  abstract publishAll(as: Iterable<A>): Conc<A>;
  abstract size(): number;
  abstract slide(): void;
  abstract subscribe(): SubscriptionInternal<A>;
}

export class BoundedHubArb<A> extends Hub<A> {
  array: Array<A>;
  publisherIndex = 0;
  subscribers: Array<number>;
  subscriberCount  = 0;
  subscribersIndex = 0;

  readonly capacity: number;

  constructor(requestedCapacity: number) {
    super();

    this.array       = Array(requestedCapacity);
    this.subscribers = Array(requestedCapacity);
    this.capacity    = requestedCapacity;
  }

  isEmpty(): boolean {
    return this.publisherIndex === this.subscribersIndex;
  }

  isFull(): boolean {
    return this.publisherIndex === this.subscribersIndex + this.capacity;
  }

  publish(a: A): boolean {
    if (this.isFull()) {
      return false;
    }

    if (this.subscriberCount !== 0) {
      const index             = this.publisherIndex % this.capacity;
      this.array[index]       = a;
      this.subscribers[index] = this.subscriberCount;
      this.publisherIndex    += 1;
    }

    return true;
  }

  publishAll(as: Iterable<A>): Conc<A> {
    const asArray   = Conc.from(as);
    const n         = asArray.length;
    const size      = this.publisherIndex - this.subscribersIndex;
    const available = this.capacity - size;
    const forHub    = Math.min(n, available);

    if (forHub === 0) {
      return asArray;
    }

    let iteratorIndex     = 0;
    const publishAllIndex = this.publisherIndex + forHub;

    while (this.publisherIndex !== publishAllIndex) {
      const a              = asArray[iteratorIndex++]!;
      const index          = this.publisherIndex % this.capacity;
      this.array[index]    = a;
      this.publisherIndex += 1;
    }

    return asArray.drop(iteratorIndex - 1);
  }

  size(): number {
    return this.publisherIndex - this.subscribersIndex;
  }

  slide(): void {
    if (this.subscribersIndex !== this.publisherIndex) {
      const index             = this.subscribersIndex % this.capacity;
      this.array[index]       = null as unknown as A;
      this.subscribers[index] = 0;
      this.subscribersIndex  += 1;
    }
  }

  subscribe(): SubscriptionInternal<A> {
    this.subscriberCount += 1;

    return new BoundedHubArbSubscription(this, this.publisherIndex, false);
  }
}

class BoundedHubArbSubscription<A> extends SubscriptionInternal<A> {
  constructor(private self: BoundedHubArb<A>, private subscriberIndex: number, private unsubscribed: boolean) {
    super();
  }

  isEmpty(): boolean {
    return (
      this.unsubscribed ||
      this.self.publisherIndex === this.subscriberIndex ||
      this.self.publisherIndex === this.self.subscribersIndex
    );
  }

  poll(default_: A): A {
    if (this.unsubscribed) {
      return default_;
    }

    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);

    if (this.subscriberIndex !== this.self.publisherIndex) {
      const index = this.subscriberIndex % this.self.capacity;
      const a     = this.self.array[index]!;

      this.self.subscribers[index] -= 1;

      if (this.self.subscribers[index] === 0) {
        this.self.array[index]      = null as unknown as A;
        this.self.subscribersIndex += 1;
      }

      this.subscriberIndex += 1;
      return a;
    }

    return default_;
  }

  pollUpTo(n: number): Conc<A> {
    if (this.unsubscribed) {
      return Conc.empty();
    }

    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
    const size           = this.self.publisherIndex - this.subscriberIndex;
    const toPoll         = Math.min(n, size);

    if (toPoll <= 0) {
      return Conc.empty();
    }

    let builder         = Conc.empty<A>();
    const pollUpToIndex = this.subscriberIndex + toPoll;

    while (this.subscriberIndex !== pollUpToIndex) {
      const index           = this.subscriberIndex % this.self.capacity;
      const a               = this.self.array[index] as A;
      builder               = builder.append(a);
      this.subscriberIndex += 1;
    }

    return builder;
  }

  size() {
    if (this.unsubscribed) {
      return 0;
    }

    return this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
  }

  unsubscribe(): void {
    if (!this.unsubscribed) {
      this.unsubscribed          = true;
      this.self.subscriberCount -= 1;
      this.subscriberIndex       = Math.max(this.subscriberIndex, this.self.subscribersIndex);

      while (this.subscriberIndex !== this.self.publisherIndex) {
        const index                   = this.subscriberIndex % this.self.capacity;
        this.self.subscribers[index] -= 1;

        if (this.self.subscribers[index] === 0) {
          this.self.array[index]      = null as unknown as A;
          this.self.subscribersIndex += 1;
        }

        this.subscriberIndex += 1;
      }
    }
  }
}
export class BoundedHubPow2<A> extends Hub<A> {
  array: Array<A>;
  mask: number;
  publisherIndex = 0;
  subscribers: Array<number>;
  subscriberCount  = 0;
  subscribersIndex = 0;

  readonly capacity: number;

  constructor(requestedCapacity: number) {
    super();

    this.array       = Array(requestedCapacity);
    this.mask        = requestedCapacity - 1;
    this.subscribers = Array(requestedCapacity);
    this.capacity    = requestedCapacity;
  }

  isEmpty(): boolean {
    return this.publisherIndex === this.subscribersIndex;
  }

  isFull(): boolean {
    return this.publisherIndex === this.subscribersIndex + this.capacity;
  }

  publish(a: A): boolean {
    if (this.isFull()) {
      return false;
    }

    if (this.subscriberCount !== 0) {
      const index             = this.publisherIndex & this.mask;
      this.array[index]       = a;
      this.subscribers[index] = this.subscriberCount;
      this.publisherIndex    += 1;
    }

    return true;
  }

  publishAll(as: Iterable<A>): Conc<A> {
    const asArray   = Conc.from(as);
    const n         = asArray.length;
    const size      = this.publisherIndex - this.subscribersIndex;
    const available = this.capacity - size;
    const forHub    = Math.min(n, available);

    if (forHub === 0) {
      return asArray;
    }

    let iteratorIndex     = 0;
    const publishAllIndex = this.publisherIndex + forHub;

    while (this.publisherIndex !== publishAllIndex) {
      const a              = asArray[iteratorIndex++]!;
      const index          = this.publisherIndex & this.mask;
      this.array[index]    = a;
      this.publisherIndex += 1;
    }

    return asArray.drop(iteratorIndex - 1);
  }

  size(): number {
    return this.publisherIndex - this.subscribersIndex;
  }

  slide(): void {
    if (this.subscribersIndex !== this.publisherIndex) {
      const index             = this.subscribersIndex & this.mask;
      this.array[index]       = null as unknown as A;
      this.subscribers[index] = 0;
      this.subscribersIndex  += 1;
    }
  }

  subscribe(): SubscriptionInternal<A> {
    this.subscriberCount += 1;

    return new BoundedHubPow2Subcription(this, this.publisherIndex, false);
  }
}

class BoundedHubPow2Subcription<A> extends SubscriptionInternal<A> {
  constructor(private self: BoundedHubPow2<A>, private subscriberIndex: number, private unsubscribed: boolean) {
    super();
  }

  isEmpty(): boolean {
    return (
      this.unsubscribed ||
      this.self.publisherIndex === this.subscriberIndex ||
      this.self.publisherIndex === this.self.subscribersIndex
    );
  }

  poll(default_: A): A {
    if (this.unsubscribed) {
      return default_;
    }

    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);

    if (this.subscriberIndex !== this.self.publisherIndex) {
      const index = this.subscriberIndex & this.self.mask;
      const a     = this.self.array[index]!;

      this.self.subscribers[index] -= 1;

      if (this.self.subscribers[index] === 0) {
        this.self.array[index]      = null as unknown as A;
        this.self.subscribersIndex += 1;
      }

      this.subscriberIndex += 1;
      return a;
    }

    return default_;
  }

  pollUpTo(n: number): Conc<A> {
    if (this.unsubscribed) {
      return Conc.empty();
    }

    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
    const size           = this.self.publisherIndex - this.subscriberIndex;
    const toPoll         = Math.min(n, size);

    if (toPoll <= 0) {
      return Conc.empty();
    }

    let builder         = Conc.empty<A>();
    const pollUpToIndex = this.subscriberIndex + toPoll;

    while (this.subscriberIndex !== pollUpToIndex) {
      const index           = this.subscriberIndex & this.self.mask;
      const a               = this.self.array[index] as A;
      builder               = builder.append(a);
      this.subscriberIndex += 1;
    }

    return builder;
  }

  size() {
    if (this.unsubscribed) {
      return 0;
    }

    return this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
  }

  unsubscribe(): void {
    if (!this.unsubscribed) {
      this.unsubscribed          = true;
      this.self.subscriberCount -= 1;
      this.subscriberIndex       = Math.max(this.subscriberIndex, this.self.subscribersIndex);

      while (this.subscriberIndex < this.self.publisherIndex) {
        const index                   = this.subscriberIndex & this.self.mask;
        this.self.subscribers[index] -= 1;

        if (this.self.subscribers[index] === 0) {
          this.self.array[index]      = null as unknown as A;
          this.self.subscribersIndex += 1;
        }

        this.subscriberIndex += 1;
      }
    }
  }
}
export class BoundedHubSingle<A> extends Hub<A> {
  publisherIndex    = 0;
  subscriberCount   = 0;
  subscribers       = 0;
  value: A          = null as unknown as A;
  readonly capacity = 1;

  constructor() {
    super();
  }

  isEmpty(): boolean {
    return this.subscribers === 0;
  }

  isFull(): boolean {
    return !this.isEmpty();
  }

  publish(a: A): boolean {
    if (this.isFull()) {
      return false;
    }

    if (this.subscriberCount !== 0) {
      this.value           = a;
      this.subscribers     = this.subscriberCount;
      this.publisherIndex += 1;
    }

    return true;
  }

  publishAll(as: Iterable<A>): Conc<A> {
    const list = Conc.from(as);

    if (list.isEmpty) {
      return Conc.empty();
    }

    if (this.publish(list.unsafeHead)) {
      return list.drop(1);
    } else {
      return list;
    }
  }

  size(): number {
    return this.isEmpty() ? 0 : 1;
  }

  slide(): void {
    if (this.isFull()) {
      this.subscribers = 0;
      this.value       = null as unknown as A;
    }
  }

  subscribe(): SubscriptionInternal<A> {
    this.subscriberCount += 1;

    return new BoundedHubSingleSubscription(this, this.publisherIndex, false);
  }
}

class BoundedHubSingleSubscription<A> extends SubscriptionInternal<A> {
  constructor(private self: BoundedHubSingle<A>, private subscriberIndex: number, private unsubscribed: boolean) {
    super();
  }

  isEmpty(): boolean {
    return this.unsubscribed || this.self.subscribers === 0 || this.subscriberIndex === this.self.publisherIndex;
  }

  poll(default_: A): A {
    if (this.isEmpty()) {
      return default_;
    }
    const a                = this.self.value;
    this.self.subscribers -= 1;

    if (this.self.subscribers === 0) {
      this.self.value = null as unknown as A;
    }

    this.subscriberIndex += 1;

    return a;
  }

  pollUpTo(n: number): Conc<A> {
    if (this.isEmpty() || n < 1) {
      return Conc.empty();
    }
    const a                = this.self.value;
    this.self.subscribers -= 1;

    if (this.self.subscribers === 0) {
      this.self.value = null as unknown as A;
    }

    this.subscriberIndex += 1;

    return Conc.single(a);
  }

  size() {
    return this.isEmpty() ? 0 : 1;
  }

  unsubscribe(): void {
    if (!this.unsubscribed) {
      this.unsubscribed          = true;
      this.self.subscriberCount -= 1;

      if (this.subscriberIndex !== this.self.publisherIndex) {
        this.self.subscribers -= 1;

        if (this.self.subscribers === 0) {
          this.self.value = null as unknown as A;
        }
      }
    }
  }
}

class Node<A> {
  constructor(public value: A | null, public subscribers: number, public next: Node<A> | null) {}
}

export class UnboundedHub<A> extends Hub<A> {
  publisherHead  = new Node<A>(null, 0, null);
  publisherIndex = 0;
  publisherTail: Node<A>;
  subscribersIndex  = 0;
  readonly capacity = Number.MAX_SAFE_INTEGER;

  constructor() {
    super();

    this.publisherTail = this.publisherHead;
  }

  isEmpty(): boolean {
    return this.publisherHead === this.publisherTail;
  }

  isFull(): boolean {
    return false;
  }

  publish(a: A): boolean {
    const subscribers = this.publisherTail.subscribers;

    if (subscribers !== 0) {
      this.publisherTail.next = new Node(a, subscribers, null);
      this.publisherTail      = this.publisherTail.next;
      this.publisherIndex    += 1;
    }

    return true;
  }

  publishAll(as: Iterable<A>): Conc<A> {
    for (const a of as) {
      this.publish(a);
    }
    return Conc.empty();
  }

  size(): number {
    return this.publisherIndex - this.subscribersIndex;
  }

  slide(): void {
    if (this.publisherHead !== this.publisherTail) {
      this.publisherHead       = this.publisherHead.next!;
      this.publisherHead.value = null;
      this.subscribersIndex   += 1;
    }
  }

  subscribe(): SubscriptionInternal<A> {
    this.publisherTail.subscribers += 1;

    return new UnboundedHubSubscription(this, this.publisherTail, this.publisherIndex, false);
  }
}

class UnboundedHubSubscription<A> extends SubscriptionInternal<A> {
  constructor(
    private self: UnboundedHub<A>,
    private subscriberHead: Node<A>,
    private subscriberIndex: number,
    private unsubscribed: boolean,
  ) {
    super();
  }

  isEmpty(): boolean {
    if (this.unsubscribed) {
      return true;
    }

    let empty = true;
    let loop  = true;

    while (loop) {
      if (this.subscriberHead === this.self.publisherTail) {
        loop = false;
      } else {
        if (this.subscriberHead.next!.value !== null) {
          empty = false;
          loop  = false;
        } else {
          this.subscriberHead   = this.subscriberHead.next!;
          this.subscriberIndex += 1;
        }
      }
    }

    return empty;
  }

  poll(def: A): A {
    if (this.unsubscribed) {
      return def;
    }

    let loop   = true;
    let polled = def;

    while (loop) {
      if (this.subscriberHead === this.self.publisherTail) {
        loop = false;
      } else {
        const a = this.subscriberHead.next!.value;

        if (a != null) {
          polled = a;
          this.subscriberHead.subscribers -= 1;

          if (this.subscriberHead.subscribers === 0) {
            this.self.publisherHead       = this.self.publisherHead.next!;
            this.self.publisherHead.value = null;
            this.self.subscribersIndex   += 1;
          }

          loop = false;
        }

        this.subscriberHead   = this.subscriberHead.next!;
        this.subscriberIndex += 1;
      }
    }

    return polled;
  }

  pollUpTo(n: number): Conc<A> {
    let builder = Conc.empty<A>();
    let i       = 0;

    while (i !== n) {
      const a = this.poll(null as unknown as A);
      if (a == null) {
        i = n;
      } else {
        builder = builder.append(a);
        i      += 1;
      }
    }

    return builder;
  }

  size() {
    if (this.unsubscribed) {
      return 0;
    }

    return this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
  }

  unsubscribe(): void {
    if (!this.unsubscribed) {
      this.unsubscribed                    = true;
      this.self.publisherTail.subscribers -= 1;

      while (this.subscriberHead !== this.self.publisherTail) {
        if (this.subscriberHead.next!.value !== null) {
          this.subscriberHead.subscribers -= 1;

          if (this.subscriberHead.subscribers === 0) {
            this.self.publisherHead       = this.self.publisherHead.next!;
            this.self.publisherHead.value = null;
            this.self.subscribersIndex   += 1;
          }
        }
        this.subscriberHead = this.subscriberHead.next!;
      }
    }
  }
}

function ensureCapacity(capacity: number): asserts capacity {
  if (capacity <= 0) {
    throw new InvalidCapacityError(`A Hub cannot have a capacity of ${capacity}`);
  }
}

function nextPow2(n: number): number {
  const nextPow = Math.ceil(Math.log(n) / Math.log(2.0));

  return Math.max(Math.pow(2, nextPow), 2);
}

/**
 * @tsplus static fncts.internal.Hub makeBounded
 */
export function makeBounded<A>(requestedCapacity: number): Hub<A> {
  ensureCapacity(requestedCapacity);

  if (requestedCapacity === 1) {
    return new BoundedHubSingle();
  } else if (nextPow2(requestedCapacity) === requestedCapacity) {
    return new BoundedHubPow2(requestedCapacity);
  } else {
    return new BoundedHubArb(requestedCapacity);
  }
}

/**
 * @tsplus static fncts.internal.Hub makeUnbounded
 */
export function makeUnbounded<A>(): Hub<A> {
  return new UnboundedHub();
}

/**
 * Unsafely polls all values from a subscription.
 *
 * @tsplus getter fncts.internal.Hub.Subscription unsafePollAll
 */
export function unsafePollAll<A>(subscription: SubscriptionInternal<A>): Conc<A> {
  return subscription.pollUpTo(Number.MAX_SAFE_INTEGER);
}

/**
 * Unsafely polls the specified number of values from a subscription.
 *
 * @tsplus pipeable fncts.internal.Hub.Subscription unsafePollN
 */
export function unsafePollN(max: number) {
  return <A>(subscription: SubscriptionInternal<A>): Conc<A> => {
    return subscription.pollUpTo(max);
  };
}
