import { popScheduler } from "@fncts/observable/internal/args";
import { arrayRemove } from "@fncts/observable/internal/util";

interface WindowRecord<R, E, A> {
  seen: number;
  window: Subject<R, E, A>;
  subs: Subscription;
}

/**
 * @tsplus fluent fncts.observable.Observable windowTime
 */
export function windowTime_<R, E, A>(
  fa: Observable<R, E, A>,
  windowTimeSpan: number,
  scheduler?: SchedulerLike,
): Observable<R, E, Observable<never, E, A>>;
export function windowTime_<R, E, A>(
  fa: Observable<R, E, A>,
  windowTimeSpan: number,
  windowCreationInterval: number,
  scheduler?: SchedulerLike,
): Observable<R, E, Observable<never, E, A>>;
export function windowTime_<R, E, A>(
  fa: Observable<R, E, A>,
  windowTimeSpan: number,
  windowCreationInterval: number,
  maxWindowSize: number,
  scheduler?: SchedulerLike,
): Observable<R, E, Observable<never, E, A>>;
export function windowTime_<R, E, A>(
  fa: Observable<R, E, A>,
  windowTimeSpan: number,
  ...args: any[]
): Observable<R, E, Observable<never, E, A>> {
  const scheduler = popScheduler(args) ?? asyncScheduler;
  const windowCreationInterval: number | null = args[0] ?? null;
  const maxWindowSize: number                 = args[1] || Infinity;

  return operate_(fa, (source, subscriber, environment) => {
    let windowRecords: WindowRecord<never, E, A>[] | null = [];
    let restartOnClose = false;
    const closeWindow  = (record: { window: Subject<never, E, A>; subs: Subscription }) => {
      const { window, subs } = record;
      window.complete();
      subs.unsubscribe();
      arrayRemove(windowRecords, record);
      restartOnClose && startWindow();
    };
    const startWindow = () => {
      if (windowRecords) {
        const subs = new Subscription();
        subscriber.add(subs);
        const window = new Subject<never, E, A>();
        const record = {
          window,
          subs,
          seen: 0,
        };
        windowRecords.push(record);
        subscriber.next(window.asObservable());
        subs.add(scheduler.schedule(() => closeWindow(record), windowTimeSpan));
      }
    };

    windowCreationInterval !== null && windowCreationInterval >= 0
      ? subscriber.add(
          scheduler.schedule(function () {
            startWindow();
            !this.closed && subscriber.add(this.schedule(null, windowCreationInterval));
          }, windowCreationInterval),
        )
      : (restartOnClose = true);

    startWindow();

    const loop = (cb: (record: WindowRecord<never, E, A>) => void) => windowRecords!.slice().forEach(cb);

    const terminate = (cb: (consumer: Observer<E, any>) => void) => {
      loop(({ window }) => cb(window));
      cb(subscriber);
      subscriber.unsubscribe();
    };

    source.provideEnvironment(environment).subscribe(
      operatorSubscriber(subscriber, {
        next: (value) => {
          loop((record) => {
            record.window.next(value);
            maxWindowSize <= ++record.seen && closeWindow(record);
          });
        },
        error: (err) => terminate((consumer) => consumer.error(err)),
        complete: () => terminate((consumer) => consumer.complete()),
      }),
    );

    return () => {
      windowRecords = null!;
    };
  });
}
