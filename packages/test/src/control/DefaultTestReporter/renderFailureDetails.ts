import type { AssertionValue } from "../../data/AssertionValue.js";
import type { FailureDetails } from "../../data/FailureDetails.js";
import type { GenFailureDetails } from "../../data/GenFailureDetails.js";
import type { List } from "@fncts/base/collection/immutable/List";
import type { Cause } from "@fncts/base/data/Cause";
import type { Maybe } from "@fncts/base/data/Maybe";

import { Cons } from "@fncts/base/collection/immutable/List";
import { Vector } from "@fncts/base/collection/immutable/Vector";
import { BLUE, CYAN, RED, YELLOW } from "@fncts/base/util/AnsiFormat";

import { Fragment, Line, Message } from "../../data/LogLine.js";
import { TestTimeoutException } from "../../data/TestTimeoutException.js";

const tabSize = 2;

export function renderFailureDetails(failureDetails: FailureDetails, offset: number): Message {
  return renderGenFailureDetails(failureDetails.gen, offset)["++"](
    renderAssertionFailureDetails(failureDetails.assertion, offset),
  );
}

function renderAssertionFailureDetails(
  failureDetails: Cons<AssertionValue<any>>,
  offset: number,
): Message {
  /**
   * @tsplus tailrec
   */
  function loop(failureDetails: List<AssertionValue<any>>, rendered: Message): Message {
    const fragment = failureDetails.head;
    const whole    = failureDetails.tail.chain((l) => l.head);
    const details  = failureDetails.tail.chain((l) => l.tail);
    if (fragment.isJust() && whole.isJust() && details.isJust()) {
      return loop(
        Cons(whole.value, details.value),
        rendered[":+"](renderWhole(fragment.value, whole.value, offset)),
      );
    } else {
      return rendered;
    }
  }
  return renderFragment(failureDetails.head, offset)["++"](loop(failureDetails, Message.empty));
}

function renderWhole(
  fragment: AssertionValue<any>,
  whole: AssertionValue<any>,
  offset: number,
): Line {
  return blue(whole.showValue(offset + tabSize))
    ["+"](renderSatisfied(whole))
    ["++"](highlight(cyan(whole.assertion.value.rendered), fragment.assertion.value.rendered))
    .withOffset(offset + tabSize);
}

function renderGenFailureDetails(
  failureDetails: Maybe<GenFailureDetails>,
  offset: number,
): Message {
  return failureDetails.match(
    () => Message.empty,
    (details) => {
      const shrunken       = `${details.shrunkenInput}`;
      const initial        = `${details.initialInput}`;
      const renderShrunken = new Fragment(
        `Test failed after ${details.iterations + 1} iteration${
          details.iterations > 0 ? "s" : ""
        } with input: `,
      )
        ["+"](red(shrunken))
        .withOffset(offset + tabSize);

      return initial === shrunken
        ? renderShrunken.toMessage()
        : renderShrunken["+|"](
            new Fragment("Original input before shrinking was: ")
              ["+"](red(initial))
              .withOffset(offset + tabSize),
          );
    },
  );
}

function renderFragment(fragment: AssertionValue<any>, offset: number): Message {
  const assertionMessage = new Message(
    Vector.from(
      fragment.assertion.value.rendered.split(/\n/).map((s) =>
        cyan(s)
          .toLine()
          .withOffset(offset + tabSize),
      ),
    ),
  );
  return blue(fragment.showValue(offset + tabSize))
    ["+"](renderSatisfied(fragment))
    .withOffset(offset + tabSize)
    .toMessage()
    ["++"](assertionMessage.withOffset(tabSize));
}

function highlight(fragment: Fragment, substring: string, colorCode = YELLOW): Line {
  const parts = fragment.text.split(substring);
  if (parts.length === 1) {
    return fragment.toLine();
  } else {
    return parts.foldLeft(Line.empty, (line, part) =>
      line.fragments.length < parts.length * 2 - 2
        ? line["+"](new Fragment(part, fragment.colorCode))["+"](new Fragment(substring, colorCode))
        : line["+"](new Fragment(part, fragment.colorCode)),
    );
  }
}

function renderSatisfied(fragment: AssertionValue<any>): Fragment {
  return fragment.result.value.isSuccess
    ? new Fragment(" satisfied ")
    : new Fragment(" did not satisfy ");
}

export function renderCause(cause: Cause<any>, offset: number): Message {
  const printCause = () =>
    new Message(
      Vector.from(
        cause.prettyPrint.split(/\n/).map((s) => Line.fromString(s).withOffset(offset + tabSize)),
      ),
    );
  return cause.haltMaybe.match(printCause, (_) => {
    if (_ instanceof TestTimeoutException) {
      return new Fragment(_.message).toLine().toMessage();
    } else {
      return printCause();
    }
  });
}

function blue(s: string): Fragment {
  return new Fragment(s, BLUE);
}

function red(s: string): Fragment {
  return new Fragment(s, RED);
}

function cyan(s: string): Fragment {
  return new Fragment(s, CYAN);
}
