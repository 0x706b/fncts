import type { Atomic } from "./Atomic.js";
import type { Cause } from "@fncts/base/data/Cause";
import type { Either } from "@fncts/base/data/Either";
import type { UnsafeSink } from "@fncts/io/Push/Sink";
import type { PRef } from "@fncts/io/Ref";
import type { Scope } from "@fncts/io/Scope";

import { IO } from "@fncts/io/IO";
import { Sink } from "@fncts/io/Push/Sink";
import { type PSynchronized, PSynchronizedInternal } from "@fncts/io/Ref";

import { PRefSubject } from "./RefSubject.js";

export class Derived<EnvIn, EnvOut, ErrIn, ErrOut, ErrInRef, In, Out> extends PRefSubject<
  EnvIn,
  EnvOut,
  ErrIn,
  ErrOut,
  ErrInRef,
  In,
  Out
> {
  constructor(
    readonly use: <X>(
      f: <R, E0, A0>(_: {
        ref: Atomic<R, E0, A0>;
        mapSetError: (_: E0) => ErrInRef;
        mapGetError: (_: E0) => ErrOut;
        mapErrorInput: (_: ErrIn) => E0;
        mapSetErrorInput: (_: ErrInRef) => E0;
        mapSet: (a: In) => IO<EnvIn, ErrInRef, A0>;
        mapGet: (a: A0) => IO<EnvOut, ErrOut, Out>;
      }) => X,
    ) => X,
  ) {
    super();
  }

  get subscribers() {
    return this.use(({ ref }) => ref.subscribers);
  }

  get interrupt() {
    return this.use(({ ref }) => ref.interrupt);
  }

  onSuccess(value: In): IO<EnvIn, never, void> {
    return this.use(({ ref, mapSetErrorInput, mapSet }) =>
      mapSet(value).matchCauseIO(
        (cause) => ref.onFailure(cause.map(mapSetErrorInput)),
        (a0) => ref.onSuccess(a0),
      ),
    );
  }

  onFailure(cause: Cause<ErrIn>): IO<EnvIn, never, void> {
    return this.use(({ ref, mapErrorInput }) => ref.onFailure(cause.map(mapErrorInput)));
  }

  get get(): IO<EnvOut, ErrOut, Out> {
    return this.use(({ ref, mapGetError, mapGet }) => ref.get.matchIO((e) => IO.failNow(mapGetError(e)), mapGet));
  }

  set(a: In, __tsplusTrace?: string): IO<EnvIn, ErrInRef, void> {
    return this.use(({ ref, mapSet }) => mapSet(a).flatMap((a0) => ref.set(a0)));
  }

  modify<C>(f: (b: Out) => readonly [C, In], __tsplusTrace?: string): IO<EnvIn | EnvOut, ErrOut | ErrInRef, C> {
    return this.modifyIO((out) => IO.succeedNow(f(out)));
  }

  modifyIO<R1, E1, C>(
    f: (b: Out) => IO<R1, E1, readonly [C, In]>,
    __tsplusTrace?: string,
  ): IO<EnvIn | EnvOut | R1, ErrOut | ErrInRef | E1, C> {
    return this.use(({ ref, mapGetError, mapSet, mapGet }) =>
      ref.get.mapError(mapGetError).flatMap((a0) =>
        mapGet(a0)
          .flatMap(f)
          .flatMap(([c, a]) =>
            mapSet(a)
              .flatMap((a0) => ref.set(a0))
              .as(c),
          ),
      ),
    );
  }

  match<EC, ED, C, D>(
    ea: (_: ErrInRef) => EC,
    eb: (_: ErrOut) => ED,
    ca: (_: C) => Either<EC, In>,
    bd: (_: Out) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PRef<EnvIn, EnvOut, EC, ED, C, D> {
    return this.matchIO(ea, eb, ca, bd);
  }

  matchAll<EC, ED, C, D>(
    ea: (_: ErrInRef) => EC,
    eb: (_: ErrOut) => ED,
    ec: (_: ErrOut) => EC,
    ca: (_: C) => (_: Out) => Either<EC, In>,
    bd: (_: Out) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PRef<EnvIn | EnvOut, EnvOut, EC, ED, C, D> {
    return this.matchAllIO(ea, eb, ec, ca, bd);
  }

  matchIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: ErrInRef) => EC,
    mapGetError: (_: ErrOut) => ED,
    mapSet: (_: C) => IO<RC, EC, In>,
    mapGet: (_: Out) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronized<EnvIn | RC, EnvOut | RD, EC, ED, C, D> {
    return this.use(
      ({ ref }) =>
        new PSynchronizedInternal(
          ref.semaphore,
          this.get.matchIO((e) => IO.failNow(mapGetError(e)), mapGet),
          (c) => mapSet(c).flatMap((a) => this.set(a).mapError(mapSetError)),
        ),
    );
  }

  matchAllIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: ErrInRef) => EC,
    mapGetError: (_: ErrOut) => ED,
    mapSetGetError: (_: ErrOut) => EC,
    mapSet: (_: C) => (_: Out) => IO<RC, EC, In>,
    mapGet: (_: Out) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronized<EnvIn | EnvOut | RC, EnvOut | RD, EC, ED, C, D> {
    return this.use(
      ({ ref }) =>
        new PSynchronizedInternal(
          ref.semaphore,
          this.get.matchIO((e) => IO.failNow(mapGetError(e)), mapGet),
          (c) =>
            this.get.matchIO(
              (e) => IO.failNow(mapSetGetError(e)),
              (b) => mapSet(c)(b).flatMap((a) => this.set(a).mapError(mapSetError)),
            ),
        ),
    );
  }

  matchIOSubject<RC, RD, EI, EC, ED, C, D>(
    mapSetError: (_: ErrInRef) => EC,
    mapGetError: (_: ErrOut) => ED,
    mapErrorInput: (_: EI) => ErrIn,
    mapSetErrorInput: (_: EC) => ErrInRef,
    mapSet: (_: C) => IO<RC, EC, In>,
    mapGet: (_: Out) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PRefSubject<EnvIn | RC, EnvOut | RD, EI, ED, EC, C, D> {
    return this.use(
      (r) =>
        new Derived<EnvIn | RC, EnvOut | RD, EI, ED, EC, C, D>((f) =>
          f({
            ref: r.ref,
            mapSetError: (e0) => mapSetError(r.mapSetError(e0)),
            mapGetError: (e0) => mapGetError(r.mapGetError(e0)),
            mapErrorInput: (ei) => r.mapErrorInput(mapErrorInput(ei)),
            mapSetErrorInput: (ec) => r.mapSetErrorInput(mapSetErrorInput(ec)),
            mapSet: (c) => mapSet(c).flatMap((inp) => r.mapSet(inp).mapError(mapSetError)),
            mapGet: (a0) => r.mapGet(a0).mapError(mapGetError).flatMap(mapGet),
          }),
        ),
    );
  }

  run<R1>(sink: UnsafeSink<R1, ErrOut, Out>): IO<Scope | EnvOut | R1, never, void> {
    return this.use(({ ref, mapGet, mapGetError }) =>
      ref.run(
        Sink.unsafeMake(
          (a0) => mapGet(a0).matchCauseIO(sink.onFailure, sink.onSuccess),
          (cause) => sink.onFailure(cause.map(mapGetError)),
        ),
      ),
    );
  }
}
