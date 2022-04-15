export interface NoLocation {
  readonly _tag: "NoLocation";
}

export interface SourceLocation {
  readonly _tag: "SourceLocation";
  readonly fileName: string;
  readonly lineNumber: number;
  readonly columnNumber: number;
}

/**
 * @tsplus type fncts.TraceElement
 */
export type TraceElement = NoLocation | SourceLocation;

/**
 * @tsplus type fncts.TraceElementOps
 */
export interface TraceElementOps {}

export const TraceElement: TraceElementOps = {};

/**
 * @tsplus static fncts.TraceElementOps NoLocation
 */
export const NoLocation: TraceElement = {
  _tag: "NoLocation",
};

/**
 * @tsplus static fncts.TraceElementOps SourceLocation
 */
export function SourceLocation(fileName: string, lineNumber: number, columnNumber: number): TraceElement {
  return { _tag: "SourceLocation", fileName, lineNumber, columnNumber };
}

const LOCATION_REGEX = /^(.*?):(\d*?):(\d*?)$/;

/**
 * @tsplus static fncts.TraceElementOps parse
 */
export function parse(trace?: string): TraceElement {
  if (trace) {
    const parts = trace.match(LOCATION_REGEX);
    if (parts) {
      const fileName: string     = parts[1]!.trim();
      const lineNumber: number   = Number.parseInt(parts[2]!);
      const columnNumber: number = Number.parseInt(parts[3]!);
      return SourceLocation(fileName, lineNumber, columnNumber);
    }
    return NoLocation;
  }
  return NoLocation;
}

/**
 * @tsplus getter fncts.TraceElement show
 */
export function show(self: TraceElement): string {
  switch (self._tag) {
    case "NoLocation": {
      return "";
    }
    case "SourceLocation": {
      return `${self.fileName}:${self.lineNumber}:${self.columnNumber}`;
    }
  }
}
