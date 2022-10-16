import type { ObservableRefDescriptor } from "@fncts/observable/ObservableRef/definition";

import { BehaviorSubject } from "@fncts/observable/BehaviorSubject";

export class Atomic<A> extends ObservableRef<Store, A, A> {
  get: URIO<Store, A> = IO.serviceWithIO((reactor) => reactor.get(this.descriptor), Store.Tag);

  set(a: A): URIO<Store, void> {
    return IO.serviceWithIO((reactor) => reactor.set(this.descriptor, a), Store.Tag);
  }

  has: URIO<Store, boolean> = IO.serviceWithIO((reactor) => reactor.has(this.descriptor), Store.Tag);

  delete: URIO<Store, boolean> = IO.serviceWithIO((reactor) => reactor.delete(this.descriptor), Store.Tag);

  observable: Observable<Store, never, A> = Observable.serviceWithObservable(
    (reactor) =>
      new Observable((subscriber) => {
        return reactor.unsafeSubscribe(this.descriptor, subscriber);
      }),
    Store.Tag,
  );
}

/**
 * @tsplus type fncts.observable.Store
 * @tsplus companion fncts.observable.StoreOps
 */
export class Store {
  subjectMap = new Map<symbol, BehaviorSubject<any>>();
  get<A>(ref: ObservableRefDescriptor<A>): UIO<A> {
    return IO(() => {
      if (this.subjectMap.has(ref.id)) {
        return this.subjectMap.get(ref.id)!.value;
      } else {
        this.subjectMap.set(ref.id, new BehaviorSubject(ref.initial));
        return ref.initial;
      }
    });
  }

  set<A>(ref: ObservableRefDescriptor<A>, value: A): UIO<A> {
    return IO(() => {
      if (this.subjectMap.has(ref.id)) {
        this.subjectMap.get(ref.id)!.next(value);
      } else {
        this.subjectMap.set(ref.id, new BehaviorSubject(value));
      }
      return value;
    });
  }

  has<A>(ref: ObservableRefDescriptor<A>): UIO<boolean> {
    return IO(() => this.subjectMap.has(ref.id));
  }

  delete<A>(ref: ObservableRefDescriptor<A>): UIO<boolean> {
    return IO(() => {
      if (this.subjectMap.has(ref.id)) {
        this.subjectMap.delete(ref.id);
        return true;
      }
      return false;
    });
  }

  unsafeSubscribe<A>(ref: ObservableRefDescriptor<A>, subscriber: Subscriber<never, A>): Subscription {
    if (this.subjectMap.has(ref.id)) {
      const subject      = this.subjectMap.get(ref.id)!;
      const subscription = subject.subscribe(subscriber);
      return subscription;
    } else {
      const subject      = new BehaviorSubject<A>(ref.initial);
      const subscription = subject.subscribe(subscriber);
      this.subjectMap.set(ref.id, subject);
      return subscription;
    }
  }
}

/**
 * @tsplus static fncts.observable.StoreOps Tag
 * @tsplus implicit
 */
export const StoreTag = Tag<Store>("fncts.observable.ObservableRef.StoreTag");
