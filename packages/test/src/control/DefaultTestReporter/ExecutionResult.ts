import type { Line } from "../../data/LogLine/Line.js";
import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";

import { matchTag_ } from "@fncts/base/util/pattern";

export interface Failed {
  readonly _tag: "Failed";
}

export const Failed: Failed = {
  _tag: "Failed",
};

export interface Passed {
  readonly _tag: "Passed";
}

export const Passed: Passed = {
  _tag: "Passed",
};

export interface Ignored {
  readonly _tag: "Ignored";
}

export const Ignored: Ignored = {
  _tag: "Ignored",
};

export type Status = Failed | Passed | Ignored;

interface Test {
  readonly _tag: "Test";
}

export const Test: ResultType = {
  _tag: "Test",
};

export interface Suite {
  readonly _tag: "Suite";
}

export const Suite: ResultType = {
  _tag: "Suite",
};

export interface Other {
  readonly _tag: "Other";
}

export const Other: ResultType = {
  _tag: "Other",
};

export type ResultType = Test | Suite | Other;

/**
 * @tsplus type fncts.test.control.ExecutionResult
 */
export class ExecutionResult {
  constructor(
    readonly resultType: ResultType,
    readonly label: string,
    readonly status: Status,
    readonly offset: number,
    readonly annotations: List<TestAnnotationMap>,
    readonly lines: List<Line>,
  ) {}

  withAnnotations(annotations: List<TestAnnotationMap>): ExecutionResult {
    return new ExecutionResult(
      this.resultType,
      this.label,
      this.status,
      this.offset,
      annotations,
      this.lines,
    );
  }
}

export function rendered(
  caseType: ResultType,
  label: string,
  status: Status,
  offset: number,
  lines: List<Line>,
): ExecutionResult {
  return new ExecutionResult(caseType, label, status, offset, Nil(), lines);
}

/**
 * @tsplus operator fncts.test.control.ExecutionResult &&
 */
export function and_(self: ExecutionResult, that: ExecutionResult): ExecutionResult {
  if (self.status._tag === "Ignored") {
    return that;
  }
  if (that.status._tag === "Ignored") {
    return self;
  }
  if (self.status._tag === "Failed" && that.status._tag === "Failed") {
    return new ExecutionResult(
      self.resultType,
      self.label,
      self.status,
      self.offset,
      self.annotations,
      self.lines.concat(that.lines.tail.getOrElse(Nil())),
    );
  }
  if (self.status._tag === "Passed") {
    return that;
  }
  if (that.status._tag === "Passed") {
    return self;
  }
  throw new Error("BUG");
}

/**
 * @tsplus operator fncts.test.control.ExecutionResult ||
 */
export function or_(self: ExecutionResult, that: ExecutionResult): ExecutionResult {
  if (self.status._tag === "Ignored") {
    return that;
  }
  if (that.status._tag === "Ignored") {
    return self;
  }
  if (self.status._tag === "Failed" && that.status._tag === "Failed") {
    return new ExecutionResult(
      self.resultType,
      self.label,
      self.status,
      self.offset,
      self.annotations,
      self.lines.concat(that.lines.tail.getOrElse(Nil())),
    );
  }
  if (self.status._tag === "Passed") {
    return self;
  }
  if (that.status._tag === "Passed") {
    return that;
  }
  throw new Error("BUG");
}

/**
 * @tsplus getter fncts.test.control.ExecutionResult invert
 */
export function invert(self: ExecutionResult): ExecutionResult {
  return matchTag_(self.status, {
    Ignored: () => self,
    Failed: () =>
      new ExecutionResult(
        self.resultType,
        self.label,
        Passed,
        self.offset,
        self.annotations,
        self.lines,
      ),
    Passed: () =>
      new ExecutionResult(
        self.resultType,
        self.label,
        Failed,
        self.offset,
        self.annotations,
        self.lines,
      ),
  });
}
