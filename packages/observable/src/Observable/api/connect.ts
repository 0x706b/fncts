export interface ConnectConfig<E, A> {
  readonly connector: () => SubjectLike<E, A>;
}

const DEFAULT_CONNECT_CONFIG: ConnectConfig<any, any> = {
  connector: () => new Subject(),
};

/**
 * @tsplus fluent fncts.observable.Observable connect
 */
export function connect<R, E, A, R1, E1, B>(
  fa: Observable<R, E, A>,
  selector: (shared: Observable<R, E, A>) => ObservableInput<R1, E1, B>,
  config: ConnectConfig<E, A> = DEFAULT_CONNECT_CONFIG,
): Observable<R | R1, E | E1, B> {
  const { connector } = config;
  return fa.operate((source, subscriber, environment) => {
    const subject = connector();
    Observable.from(selector(Observable.fromSubscribable(subject)))
      .provideEnvironment(environment)
      .subscribe(subscriber);
    subscriber.add(source.provideEnvironment(environment).subscribe(subject));
  });
}
