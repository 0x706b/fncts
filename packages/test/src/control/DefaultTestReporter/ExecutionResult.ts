import type { List } from "@fncts/base/collection/immutable/List";
import type { Vector } from "@fncts/base/collection/immutable/Vector";

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

export const Test: Test = {
  _tag: "Test",
};

export interface Suite {
  readonly _tag: "Suite";
}

export const Suite: Suite = {
  _tag: "Suite",
};

export type CaseType = Test | Suite;

/**
 * @tsplus type fncts.test.control.ExecutionResult
 */
export class ExecutionResult {
  constructor(
    readonly caseType: CaseType,
    readonly label: string,
    readonly status: Status,
    readonly offset: number,
    readonly rendered: Vector<string>,
  ) {}

  withAnnotations(annotations: List<string>): ExecutionResult {
    if (this.rendered.isEmpty() || annotations.isEmpty()) {
      return this;
    } else {
      const renderedAnnotations     = ` - ${annotations.join(", ")}`;
      const head                    = this.rendered.head.getOrElse("");
      const tail                    = this.rendered.tail;
      const renderedWithAnnotations = tail.prepend(head + renderedAnnotations);
      return new ExecutionResult(
        this.caseType,
        this.label,
        this.status,
        this.offset,
        renderedWithAnnotations,
      );
    }
  }
}

export function rendered(
  caseType: CaseType,
  label: string,
  status: Status,
  offset: number,
  lines: Vector<string>,
): ExecutionResult {
  return new ExecutionResult(caseType, label, status, offset, lines);
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
      self.caseType,
      self.label,
      self.status,
      self.offset,
      self.rendered.concat(that.rendered.tail),
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
      self.caseType,
      self.label,
      self.status,
      self.offset,
      self.rendered.concat(that.rendered.tail),
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
      new ExecutionResult(self.caseType, self.label, Passed, self.offset, self.rendered),
    Passed: () =>
      new ExecutionResult(self.caseType, self.label, Failed, self.offset, self.rendered),
  });
}
