import type { Push } from "@fncts/io/Push/definition";

export const enum SyncProducerTag {
  Success,
  FromSync,
  FromArray,
  FromIterable,
}

/**
 * @tsplus type fncts.io.Push.SyncProducer
 * @tsplus companion fncts.io.Push.SyncProducerOps
 */
export type SyncProducer<A> = Success<A> | FromSync<A> | FromArray<A> | FromIterable<A>;

export class Success<A> {
  readonly _tag = SyncProducerTag.Success;
  constructor(readonly source: A) {}
}

export class FromSync<A> {
  readonly _tag = SyncProducerTag.FromSync;
  constructor(readonly f: Lazy<A>) {}
}

export class FromArray<A> {
  readonly _tag = SyncProducerTag.FromArray;
  constructor(readonly array: ReadonlyArray<A>) {}
}

export class FromIterable<A> {
  readonly _tag = SyncProducerTag.FromIterable;
  constructor(readonly iterable: Iterable<A>) {}
}

/**
 * @tsplus static fncts.io.Push.SyncProducerOps Success
 */
export function success<A>(source: A): SyncProducer<A> {
  return new Success(source);
}

/**
 * @tsplus static fncts.io.Push.SyncProducerOps fromSync
 */
export function fromSync<A>(f: Lazy<A>): SyncProducer<A> {
  return new FromSync(f);
}

/**
 * @tsplus static fncts.io.Push.SyncProducerOps fromArray
 */
export function fromArray<A extends ReadonlyArray<any>>(array: A): SyncProducer<A[number]> {
  return new FromArray(array);
}

/**
 * @tsplus static fncts.io.Push.SyncProducerOps fromIterable
 */
export function fromIterable<A>(iterable: Iterable<A>): SyncProducer<A> {
  return new FromIterable(iterable);
}

export function syncOnce<A>(f: () => A): UIO<A> {
  let memoized: Maybe<A> = Nothing();
  const get              = () => {
    if (memoized.isJust()) {
      return memoized.value;
    } else {
      const a  = f();
      memoized = Just(a);
      return a;
    }
  };

  return IO(get);
}

/**
 * @tsplus fluent fncts.io.Push.SyncProducer runSink
 */
export function runSink<R, E, A>(self: SyncProducer<A>, sink: Push.UnsafeSink<R, E, A>): IO<R, never, unknown> {
  switch (self._tag) {
    case SyncProducerTag.Success:
      return sink.onSuccess(self.source);
    case SyncProducerTag.FromSync:
      return IO.defer(() => sink.onSuccess(self.f()));
    case SyncProducerTag.FromArray:
      return arrayToSink(self.array, sink);
    case SyncProducerTag.FromIterable:
      return iterableToSink(self.iterable, sink);
  }
}

function arrayToSink<A, R>(array: ReadonlyArray<A>, sink: Push.UnsafeSink<R, never, A>): IO<R, never, unknown> {
  if (array.length === 0) return IO.unit;
  else if (array.length === 1) return sink.onSuccess(array[0]);
  else {
    return array.mapIO((a) => sink.onSuccess(a));
  }
}

function iterableToSink<A, R>(iterable: Iterable<A>, sink: Push.UnsafeSink<R, never, A>): IO<R, never, unknown> {
  return IO.foreach(iterable, (a) => sink.onSuccess(a));
}
