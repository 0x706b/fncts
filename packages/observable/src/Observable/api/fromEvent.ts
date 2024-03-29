type EventHandler = (...args: any[]) => void;

/**
 * @tsplus static fncts.observable.ObservableOps fromEvent
 */
export function fromEvent<A extends ReadonlyArray<unknown>>(
  addHandler: (handler: (...args: A) => void) => any,
  removeHandler?: (handler: EventHandler, signal?: any) => void,
): Observable<never, never, A extends [infer X] ? X : A> {
  return new Observable((subscriber) => {
    const handler  = (...e: any[]) => subscriber.next(e.length === 1 ? e[0] : e);
    const retValue = addHandler(handler as any);
    return removeHandler && (() => removeHandler(handler, retValue));
  });
}
