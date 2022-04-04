export class StackTraceBuilder {
  private last: TraceElement | undefined = undefined;

  private builder: ConcBuilder<TraceElement> = Conc.builder();

  append(trace: TraceElement | undefined): void {
    if (trace != null && trace !== this.last && trace !== TraceElement.NoLocation) {
      this.builder.append(trace);
      this.last = trace;
    }
  }

  result(): Conc<TraceElement> {
    return this.builder.result();
  }
}
