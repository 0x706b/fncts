export interface ConnectConfig<E, A> {
  readonly connector: () => SubjectLike<E, A>;
}

const DEFAULT_CONNECT_CONFIG: ConnectConfig<any, any> = {
  connector: () => new Subject(),
};

/**
 * @tsplus fluent fncts.observable.Observable connect
 */
export function connect<E, A, E1, B>(
  fa: Observable<E, A>,
  selector: (shared: Observable<E, A>) => ObservableInput<E1, B>,
  config: ConnectConfig<E, A> = DEFAULT_CONNECT_CONFIG,
): Observable<E | E1, B> {
  const { connector } = config;
  return operate_(fa, (source, subscriber) => {
    const subject = connector();
    Observable.from(selector(Observable.fromSubscribable(subject))).subscribe(subscriber);
    subscriber.add(source.subscribe(subject));
  });
}
