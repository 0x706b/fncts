import type { Cause, Unified } from "../definition";

const INDENT_SIZE = 4;

function renderUnified(indent: number, prefix: string, unified: Unified) {
  const baseIndent    = " ".repeat(indent * INDENT_SIZE);
  const messageIndent = baseIndent + " ".repeat(INDENT_SIZE);
  return (
    baseIndent +
    prefix +
    "\n" +
    unified.message.map((line) => messageIndent + line).join("\n") +
    "\n" +
    unified.trace.map((trace) => `${messageIndent}at ${trace}`).join("\n")
  );
}

function renderCause<E>(cause: Cause<E>): string {
  let r = "";
  let n = 0;
  for (const unified of cause.unified) {
    if (n === 0) {
      r += renderUnified(n, `Exception in fiber "${unified.fiberId.threadName}":`, unified);
    } else {
      r += "\n";
      r += renderUnified(n, "Suppressed:", unified);
    }
    n++;
  }
  return r;
}

/**
 * @tsplus getter fncts.data.Cause prettyPrint
 */
export function prettyPrint<E>(self: Cause<E>): string {
  return renderCause(self);
}
