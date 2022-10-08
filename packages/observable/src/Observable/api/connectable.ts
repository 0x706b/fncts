export interface ConnectableLike<R, E, A> extends Observable<R, E, A> {
  connect(): Subscription;
}

export interface ConnectableConfig<E, A> {
  readonly connector: () => SubjectLike<E, A>;
  readonly resetOnDisconnect?: boolean;
}

const DEFAULT_CONFIG: ConnectableConfig<any, any> = {
  connector: () => new Subject(),
  resetOnDisconnect: false,
};

export class Connectable<R, E, A> extends Observable<R, E, A> implements ConnectableLike<R, E, A> {
  protected connection: Subscription | null;
  protected connector: () => SubjectLike<E, A>;
  protected resetOnDisconnect: boolean;
  protected source: Observable<R, E, A>;
  protected subject: SubjectLike<E, A>;
  constructor(source: ObservableInput<R, E, A>, config: ConnectableConfig<E, A>) {
    const { connector, resetOnDisconnect = true } = config;
    const subject = connector();
    super((subscriber) => {
      return subject.subscribe(subscriber);
    });
    this.connection        = null;
    this.subject           = subject;
    this.connector         = connector;
    this.resetOnDisconnect = resetOnDisconnect;
    this.source            = Observable.from(source);
  }
  connect() {
    if (!this.connection || this.connection.closed) {
      this.connection = Observable.defer(this.source).provideEnvironment(this.environment).subscribe(this.subject);
      if (this.resetOnDisconnect) {
        this.connection.add(() => (this.subject = this.connector()));
      }
    }
    return this.connection;
  }
}

/**
 * @tsplus fluent fncts.observable.Observable connectable
 */
export function connectable<R, E, A>(
  source: ObservableInput<R, E, A>,
  config: ConnectableConfig<E, A> = DEFAULT_CONFIG,
): Connectable<R, E, A> {
  return new Connectable(source, config);
}
