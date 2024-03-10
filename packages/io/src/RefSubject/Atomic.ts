import type { Sink } from "@fncts/io/Push";

import { AtomicReference } from "@fncts/base/internal/AtomicReference";
import { Hold, Push } from "@fncts/io/Push";
import { Atomic } from "@fncts/io/Ref";
import { RefSubjectInternal } from "@fncts/io/RefSubject/definition";

export class AtomicRefSubject<E, A> extends RefSubjectInternal<never, E, A, A> {
  readonly stream   = new Hold<never, E, A>(Push.never);
  readonly maybeRef = new Atomic(this.stream.current);
  readonly ref      = new AtomicEmitRef(
    new AtomicDimapRef(
      this.maybeRef,
      (v) => v.getOrElse(this.initial),
      (a) => Just(a),
    ),
    this.stream,
  );

  constructor(readonly initial: A) {
    super();
    this.stream.current.set(Just(initial));
  }

  get get() {
    return this.ref.get;
  }

  set(value: A, __tsplusTrace?: string) {
    return this.ref.set(value);
  }

  modify<E, A, B>(
    this: AtomicRefSubject<E, A>,
    f: (a: A) => readonly [B, A],
    __tsplusTrace?: string,
  ): IO<never, never, B> {
    return this.ref.modify(f);
  }

  run<R>(emitter: Sink<R, E, A>): IO<R, never, unknown> {
    return this.stream.run(emitter);
  }

  event(value: A): IO<never, never, void> {
    return this.stream.event(value);
  }

  error(cause: Cause<E>): IO<never, never, void> {
    return this.stream.error(cause);
  }

  unsafeEvent(value: A): void {
    this.stream.event(value).unsafeRunFiber();
  }

  unsafeError(cause: Cause<E>): void {
    this.stream.error(cause).unsafeRunFiber();
  }

  get unsafeGet(): A {
    return this.ref.unsafeGet;
  }
}

class AtomicDimapRef<A, B> extends Atomic<B> {
  constructor(
    readonly ref: Atomic<A>,
    readonly f: (a: A) => B,
    readonly g: (b: B) => A,
  ) {
    const value = new (class extends AtomicReference<B> {
      constructor(
        readonly ref: AtomicReference<A>,
        readonly f: (a: A) => B,
        readonly g: (b: B) => A,
      ) {
        super(f(ref.initial));
      }

      get get() {
        return this.f(this.ref.get);
      }

      set(value: B) {
        this.ref.set(this.g(value));
      }

      compareAndSet(old: B, value: B): boolean {
        return this.ref.compareAndSet(this.g(old), this.g(value));
      }

      getAndSet(value: B): B {
        return this.f(this.ref.getAndSet(this.g(value)));
      }
    })(ref.value, f, g);
    super(value);
  }
}

class AtomicEmitRef<E, A> extends Atomic<A> {
  constructor(
    readonly ref: Atomic<A>,
    readonly sink: Sink<never, E, A>,
  ) {
    super(ref.value);
  }

  get get() {
    return this.ref.get;
  }

  get unsafeGet(): A {
    return this.ref.unsafeGet;
  }

  unsafeSet(value: A) {
    this.ref.unsafeSet(value);
    this.sink.event(value).unsafeRunFiber();
  }

  set(value: A, __tsplusTrace?: string) {
    return this.ref.set(value) < this.sink.event(value);
  }

  modify<B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
    return this.ref.modify(f) < this.ref.get.flatMap((value) => this.sink.event(value));
  }
}
