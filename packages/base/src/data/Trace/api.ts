/**
 * @tsplus pipeable fncts.Trace combine
 */
export function combine(that: Trace) {
  return (self: Trace): Trace => {
    return new Trace(self.fiberId.combine(that.fiberId), self.stackTrace.concat(that.stackTrace));
  };
}

/**
 * @tsplus getter fncts.Trace toJS
 */
export function toJS(self: Trace): Conc<string> {
  return self.stackTrace.map((el) => el.show);
}
