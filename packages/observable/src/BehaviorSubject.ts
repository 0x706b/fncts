export class BehaviorSubject<A> extends Subject<never, never, A> {
  constructor(private _value: A) {
    super();
  }

  get value(): A {
    return this.getValue();
  }

  getValue(): A {
    const { hasError, thrownError, _value } = this;
    if (hasError) {
      throw thrownError;
    }
    this.throwIfClosed();
    return _value;
  }

  protected subscribeInternal(subscriber: Subscriber<never, A>) {
    const subscription = super.subscribeInternal(subscriber);
    !subscription._closed && subscriber.next(this._value);
    return subscription;
  }

  next(value: A): void {
    super.next((this._value = value));
  }
}
