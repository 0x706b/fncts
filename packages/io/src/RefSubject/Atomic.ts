import type { Emitter } from "@fncts/io/Push";

import { AtomicReference } from "@fncts/base/internal/AtomicReference";
import { Hold, Push } from "@fncts/io/Push";
import { Atomic } from "@fncts/io/Ref";
import { RefSubjectInternal } from "@fncts/io/RefSubject/definition";

export class AtomicRefSubject<E, A> extends RefSubjectInternal<never, E, A, A> {
  readonly stream   = new Hold<never, E, A>(Push.never);
  readonly maybeRef = new Atomic(this.stream.value);
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
    this.stream.value.set(Just(initial));
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

  run<R>(emitter: Emitter<R, E, A>): IO<Scope | R, never, unknown> {
    return this.stream.run(emitter);
  }

  emit(value: A): IO<never, never, void> {
    return this.stream.emit(value);
  }

  failCause(cause: Cause<E>): IO<never, never, void> {
    return this.stream.failCause(cause);
  }

  end: IO<never, never, void> = this.stream.end;

  unsafeEmit(value: A): void {
    return this.stream.emit(value).unsafeRunAsync();
  }

  unsafeFailCause(cause: Cause<E>): void {
    return this.stream.failCause(cause).unsafeRunAsync();
  }

  unsafeEnd(): void {
    return this.stream.end.unsafeRunAsync();
  }

  get unsafeGet(): A {
    return this.ref.unsafeGet;
  }
}

class AtomicDimapRef<A, B> extends Atomic<B> {
  constructor(readonly ref: Atomic<A>, readonly f: (a: A) => B, readonly g: (b: B) => A) {
    const value = new (class extends AtomicReference<B> {
      constructor(readonly ref: AtomicReference<A>, readonly f: (a: A) => B, readonly g: (b: B) => A) {
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
  constructor(readonly ref: Atomic<A>, readonly emitter: Emitter<never, E, A>) {
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
    this.emitter.emit(value).unsafeRunAsync();
  }

  set(value: A, __tsplusTrace?: string) {
    return this.ref.set(value) < this.emitter.emit(value);
  }

  modify<B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
    return this.ref.modify(f) < this.ref.get.flatMap((value) => this.emitter.emit(value));
  }
}
