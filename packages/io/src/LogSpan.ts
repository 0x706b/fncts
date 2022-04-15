/**
 * @tsplus type fncts.LogSpan
 * @tsplus companion fncts.LogSpanOps
 */
export class LogSpan {
  constructor(readonly label: string, readonly startTime: number) {}
}

/**
 * @tsplus fluent fncts.LogSpan render
 */
export function render(self: LogSpan, now: number): string {
  let s = "";
  if (self.label.indexOf(" ") < 0) {
    s += self.label;
  } else {
    s += '"';
    s += self.label;
    s += '"';
  }

  s += "=";
  s += (now - self.startTime).toString();
  s += "ms";

  return s;
}
