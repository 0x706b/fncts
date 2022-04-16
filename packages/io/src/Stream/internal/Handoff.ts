import type { SinkEndReason } from "./SinkEndReason.js";

import { tuple } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.control.Stream.Handoff
 * @tsplus companion fncts.control.Stream.HandoffOps
 */
export class Handoff<A> {
  constructor(readonly ref: Ref<State<A>>) {}
}

export const StateTypeId = Symbol.for("fncts.control.Stream.Handoff.State");

export const EmptyTypeId = Symbol.for("fncts.control.Stream.Handoff.State.Empty");
export class Empty {
  readonly _typeId: typeof StateTypeId = StateTypeId;
  readonly _tag: typeof EmptyTypeId    = EmptyTypeId;

  constructor(readonly notifyConsumer: Future<never, void>) {}
}

export const FullTypeId = Symbol.for("fncts.control.Stream.Handoff.State.Full");
export class Full<A> {
  readonly _typeId: typeof StateTypeId = StateTypeId;
  readonly _tag: typeof FullTypeId     = FullTypeId;

  constructor(readonly a: A, readonly notifyProducer: Future<never, void>) {}
}

export type State<A> = Empty | Full<A>;

/**
 * @tsplus static fncts.control.Stream.HandoffOps __call
 */
export function make<A>(): UIO<Handoff<A>> {
  return Future.make<never, void>()
    .flatMap((p) => Ref.make<State<A>>(new Empty(p)))
    .map((refState) => new Handoff(refState));
}

/**
 * @tsplus fluent fncts.control.Stream.Handoff offer
 */
export function offer<A>(handoff: Handoff<A>, a: A): UIO<void> {
  return Future.make<never, void>().flatMap(
    (p) =>
      handoff.ref.modify((s) => {
        switch (s._tag) {
          case FullTypeId:
            return tuple(s.notifyProducer.await.apSecond(handoff.offer(a)), s);
          case EmptyTypeId:
            return tuple(s.notifyConsumer.succeed(undefined).apSecond(p.await), new Full(a, p));
        }
      }).flatten,
  );
}

/**
 * @tsplus getter fncts.control.Stream.Handoff take
 */
export function take<A>(handoff: Handoff<A>): UIO<A> {
  return Future.make<never, void>().flatMap(
    (p) =>
      handoff.ref.modify((s) => {
        switch (s._tag) {
          case FullTypeId:
            return tuple(s.notifyProducer.succeed(undefined).as(s.a), new Empty(p));
          case EmptyTypeId:
            return tuple(s.notifyConsumer.await.apSecond(handoff.take), s);
        }
      }).flatten,
  );
}

/**
 * @tsplus getter fncts.control.Stream.Handoff poll
 */
export function poll<A>(handoff: Handoff<A>): UIO<Maybe<A>> {
  return Future.make<never, void>().flatMap(
    (p) =>
      handoff.ref.modify((s) => {
        switch (s._tag) {
          case FullTypeId:
            return tuple(s.notifyProducer.succeed(undefined).as(Just(s.a)), new Empty(p));
          case EmptyTypeId:
            return tuple(IO.succeedNow(Nothing()), s);
        }
      }).flatten,
  );
}

export const HandoffSignalTypeId = Symbol.for("fncts.control.Stream.HandoffSignal");

export const EmitTypeId = Symbol.for("fncts.control.Stream.HandoffSignal.Emit");
export type EmitTypeId = typeof EmitTypeId;
export class Emit<A> {
  readonly _typeId: typeof HandoffSignalTypeId = HandoffSignalTypeId;
  readonly _tag: typeof EmitTypeId             = EmitTypeId;

  constructor(readonly els: Conc<A>) {}
}

export const HaltTypeId = Symbol.for("fncts.control.Stream.HandoffSignal.Halt");
export type HaltTypeId = typeof HaltTypeId;
export class Halt<E> {
  readonly _typeId: typeof HandoffSignalTypeId = HandoffSignalTypeId;
  readonly _tag: typeof HaltTypeId             = HaltTypeId;

  constructor(readonly error: Cause<E>) {}
}

export const EndTypeId = Symbol("fncts.control.Stream.HandoffSignal.End");
export type EndTypeId = typeof EndTypeId;
export class End<C> {
  readonly _typeId: typeof HandoffSignalTypeId = HandoffSignalTypeId;
  readonly _tag: typeof EndTypeId              = EndTypeId;

  constructor(readonly reason: SinkEndReason<C>) {}
}

/**
 * @tsplus type fncts.control.Stream.HandoffSignal
 */
export type HandoffSignal<C, E, A> = Emit<A> | Halt<E> | End<C>;

/**
 * @tsplus type fncts.control.Stream.HandoffSignalOps
 */
export interface HandoffSignalOps {}

export const HandoffSignal: HandoffSignalOps = {};

/**
 * @tsplus static fncts.control.Stream.HandoffSignalOps Emit
 */
export function emit<A>(els: Conc<A>): HandoffSignal<never, never, A> {
  return new Emit(els);
}

/**
 * @tsplus static fncts.control.Stream.HandoffSignalOps Halt
 */
export function halt<E>(error: Cause<E>): HandoffSignal<never, E, never> {
  return new Halt(error);
}

/**
 * @tsplus static fncts.control.Stream.HandoffSignalOps End
 */
export function end<C>(reason: SinkEndReason<C>): HandoffSignal<C, never, never> {
  return new End(reason);
}

/**
 * @tsplus fluent fncts.control.Stream.HandoffSignal match
 */
export function matchSignal_<C, E, A, B, D, F>(
  signal: HandoffSignal<C, E, A>,
  cases: {
    Emit: (_: Emit<A>) => B;
    Halt: (_: Halt<E>) => D;
    End: (_: End<C>) => F;
  },
): B | D | F {
  switch (signal._tag) {
    case EmitTypeId:
      return cases.Emit(signal);
    case HaltTypeId:
      return cases.Halt(signal);
    case EndTypeId:
      return cases.End(signal);
  }
}
