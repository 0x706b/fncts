/**
 * @tsplus type fncts.LogLevel
 * @tsplus companion fncts.LogLevelOps
 */
export class LogLevel {
  constructor(readonly ordinal: number, readonly label: string, readonly syslog: number) {}
}

/**
 * @tsplus fluent fncts.LogLevel lt
 * @tsplus operator fncts.LogLevel <
 */
export function lt(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal < that.ordinal;
}

/**
 * @tsplus fluent fncts.LogLevel lte
 * @tsplus operator fncts.LogLevel <=
 */
export function lte(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal <= that.ordinal;
}

/**
 * @tsplus fluent fncts.LogLevel gte
 * @tsplus operator fncts.LogLevel >=
 */
export function gte(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal >= that.ordinal;
}

/**
 * @tsplus fluent fncts.LogLevel gt
 * @tsplus operator fncts.LogLevel >
 */
export function gt(self: LogLevel, that: LogLevel): boolean {
  return self.ordinal > that.ordinal;
}

/**
 * @tsplus static fncts.LogLevelOps All
 */
export const All = new LogLevel(Number.MIN_SAFE_INTEGER, "ALL", 0);

/**
 * @tsplus static fncts.LogLevelOps Fatal
 */
export const Fatal = new LogLevel(50000, "FATAL", 2);

/**
 * @tsplus static fncts.LogLevelOps Error
 */
export const Error = new LogLevel(40000, "ERROR", 3);

/**
 * @tsplus static fncts.LogLevelOps Warning
 */
export const Warning = new LogLevel(30000, "WARN", 4);

/**
 * @tsplus static fncts.LogLevelOps Info
 */
export const Info = new LogLevel(20000, "INFO", 6);

/**
 * @tsplus static fncts.LogLevelOps Debug
 */
export const Debug = new LogLevel(10000, "DEBUG", 7);

/**
 * @tsplus static fncts.LogLevelOps Trace
 */
export const Trace = new LogLevel(0, "TRACE", 7);

/**
 * @tsplus static fncts.LogLevelOps None
 */
export const None = new LogLevel(Number.MAX_SAFE_INTEGER, "NONE", 7);
