import type { SinkEndReason } from "./SinkEndReason.js";

import { tuple } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.io.Stream.Handoff
 * @tsplus companion fncts.io.Stream.HandoffOps
 */
export class Handoff<A> {
  constructor(readonly ref: Ref<State<A>>) {}
}

const enum HandoffStateTag {
  Empty,
  Full,
}

export const StateTypeId = Symbol.for("fncts.io.Stream.Handoff.State");

export class Empty {
  readonly [StateTypeId]: typeof StateTypeId = StateTypeId;
  readonly _tag = HandoffStateTag.Empty;
  constructor(readonly notifyConsumer: Future<never, void>) {}
}

export class Full<A> {
  readonly [StateTypeId]: typeof StateTypeId = StateTypeId;
  readonly _tag = HandoffStateTag.Full;

  constructor(
    readonly a: A,
    readonly notifyProducer: Future<never, void>,
  ) {}
}

export type State<A> = Empty | Full<A>;

/**
 * @tsplus static fncts.io.Stream.HandoffOps __call
 */
export function make<A>(): UIO<Handoff<A>> {
  return Future.make<never, void>()
    .flatMap((p) => Ref.make<State<A>>(new Empty(p)))
    .map((refState) => new Handoff(refState));
}

/**
 * @tsplus pipeable fncts.io.Stream.Handoff offer
 */
export function offer<A>(a: A) {
  return (handoff: Handoff<A>): UIO<void> => {
    return Future.make<never, void>().flatMap(
      (p) =>
        handoff.ref.modify((s) => {
          switch (s._tag) {
            case HandoffStateTag.Full:
              return tuple(s.notifyProducer.await.zipRight(handoff.offer(a)), s);
            case HandoffStateTag.Empty:
              return tuple(s.notifyConsumer.succeed(undefined).zipRight(p.await), new Full(a, p));
          }
        }).flatten,
    );
  };
}

/**
 * @tsplus getter fncts.io.Stream.Handoff take
 */
export function take<A>(handoff: Handoff<A>): UIO<A> {
  return Future.make<never, void>().flatMap(
    (p) =>
      handoff.ref.modify((s) => {
        switch (s._tag) {
          case HandoffStateTag.Full:
            return tuple(s.notifyProducer.succeed(undefined).as(s.a), new Empty(p));
          case HandoffStateTag.Empty:
            return tuple(s.notifyConsumer.await.zipRight(handoff.take), s);
        }
      }).flatten,
  );
}

/**
 * @tsplus getter fncts.io.Stream.Handoff poll
 */
export function poll<A>(handoff: Handoff<A>): UIO<Maybe<A>> {
  return Future.make<never, void>().flatMap(
    (p) =>
      handoff.ref.modify((s) => {
        switch (s._tag) {
          case HandoffStateTag.Full:
            return tuple(s.notifyProducer.succeed(undefined).as(Just(s.a)), new Empty(p));
          case HandoffStateTag.Empty:
            return tuple(IO.succeedNow(Nothing()), s);
        }
      }).flatten,
  );
}

export const HandoffSignalTypeId = Symbol.for("fncts.io.Stream.HandoffSignal");

const enum HandoffSignalTag {
  Emit,
  Halt,
  End,
}

export class Emit<A> {
  readonly [HandoffSignalTypeId]: typeof HandoffSignalTypeId = HandoffSignalTypeId;
  readonly _tag = HandoffSignalTag.Emit;
  constructor(readonly els: Conc<A>) {}
}

export const HaltTypeId = Symbol.for("fncts.io.Stream.HandoffSignal.Halt");
export type HaltTypeId = typeof HaltTypeId;
export class Halt<E> {
  readonly [HandoffSignalTypeId]: typeof HandoffSignalTypeId = HandoffSignalTypeId;
  readonly _tag = HandoffSignalTag.Halt;
  constructor(readonly error: Cause<E>) {}
}

export const EndTypeId = Symbol("fncts.io.Stream.HandoffSignal.End");
export type EndTypeId = typeof EndTypeId;
export class End {
  readonly [HandoffSignalTypeId]: typeof HandoffSignalTypeId = HandoffSignalTypeId;
  readonly _tag = HandoffSignalTag.End;
  constructor(readonly reason: SinkEndReason) {}
}

/**
 * @tsplus type fncts.io.Stream.HandoffSignal
 */
export type HandoffSignal<E, A> = Emit<A> | Halt<E> | End;

/**
 * @tsplus type fncts.io.Stream.HandoffSignalOps
 */
export interface HandoffSignalOps {}
export const HandoffSignal: HandoffSignalOps = {};

/**
 * @tsplus static fncts.io.Stream.HandoffSignalOps Emit
 */
export function emit<A>(els: Conc<A>): HandoffSignal<never, A> {
  return new Emit(els);
}

/**
 * @tsplus static fncts.io.Stream.HandoffSignalOps Halt
 */
export function halt<E>(error: Cause<E>): HandoffSignal<E, never> {
  return new Halt(error);
}

/**
 * @tsplus static fncts.io.Stream.HandoffSignalOps End
 */
export function end(reason: SinkEndReason): HandoffSignal<never, never> {
  return new End(reason);
}

/**
 * @tsplus pipeable fncts.io.Stream.HandoffSignal match
 */
export function matchSignal<E, A, B, D, F>(cases: {
  Emit: (_: Emit<A>) => B;
  Halt: (_: Halt<E>) => D;
  End: (_: End) => F;
}) {
  return (signal: HandoffSignal<E, A>): B | D | F => {
    switch (signal._tag) {
      case HandoffSignalTag.Emit:
        return cases.Emit(signal);
      case HandoffSignalTag.Halt:
        return cases.Halt(signal);
      case HandoffSignalTag.End:
        return cases.End(signal);
    }
  };
}
