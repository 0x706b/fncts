/**
 * @tsplus type fncts.data.LogLevel
 * @tsplus companion fncts.data.LogLevelOps
 */
export class LogLevel {
  constructor(
    readonly ordinal: number,
    readonly label: string,
    readonly syslog: number
  ) {}
}

/**
 * @tsplus fluent fncts.data.LogLevel lt
 * @tsplus operator fncts.data.LogLevel <
 */
export function lt(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal < that.ordinal;
}

/**
 * @tsplus fluent fncts.data.LogLevel lte
 * @tsplus operator fncts.data.LogLevel <=
 */
export function lte(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal <= that.ordinal;
}

/**
 * @tsplus fluent fncts.data.LogLevel gte
 * @tsplus operator fncts.data.LogLevel >=
 */
export function gte(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal >= that.ordinal;
}

/**
 * @tsplus fluent fncts.data.LogLevel gt
 * @tsplus operator fncts.data.LogLevel >
 */
export function gt(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal > that.ordinal;
}

/**
 * @tsplus static fncts.data.LogLevelOps All
 */
export const All = new LogLevel(Number.MIN_SAFE_INTEGER, "ALL", 0);

/**
 * @tsplus static fncts.data.LogLevelOps Fatal
 */
export const Fatal = new LogLevel(50000, "FATAL", 2);

/**
 * @tsplus static fncts.data.LogLevelOps Error
 */
export const Error = new LogLevel(40000, "ERROR", 3);

/**
 * @tsplus static fncts.data.LogLevelOps Warning
 */
export const Warning = new LogLevel(30000, "WARN", 4);

/**
 * @tsplus static fncts.data.LogLevelOps Info
 */
export const Info = new LogLevel(20000, "WARN", 6);

/**
 * @tsplus static fncts.data.LogLevelOps Debug
 */
export const Debug = new LogLevel(10000, "DEBUG", 7);

/**
 * @tsplus static fncts.data.LogLevelOps Trace
 */
export const Trace = new LogLevel(0, "DEBUG", 7);

/**
 * @tsplus static fncts.data.LogLevelOps None
 */
export const None = new LogLevel(Number.MAX_SAFE_INTEGER, "NONE", 7);
