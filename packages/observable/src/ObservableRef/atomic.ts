import { BehaviorSubject } from "@fncts/observable/BehaviorSubject";

export class Atomic<A> extends ObservableRef<A, A> {
  subject = new BehaviorSubject<A>(this.descriptor.initial);

  unsafeGet() {
    return this.subject.value;
  }

  unsafeSet(a: A): void {
    this.subject.next(a);
  }

  unsafeClear(): void {
    this.subject.next(this.descriptor.initial);
  }

  observable: Observable<never, never, A> = new Observable((subscriber) => {
    return this.subject.subscribe(subscriber);
  });
}
