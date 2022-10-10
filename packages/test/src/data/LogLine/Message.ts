import type { Fragment } from "./Fragment.js";

import { Line } from "./Line.js";

/**
 * @tsplus type fncts.test.data.Message
 * @tsplus companion fncts.test.data.MessageOps
 */
export class Message {
  constructor(readonly lines: Vector<Line> = Vector.empty()) {}
}

/**
 * @tsplus static fncts.test.data.MessageOps empty
 */
export const empty: Message = new Message(Vector.empty());

/**
 * @tsplus static fncts.test.data.MessageOps __call
 */
export function makeMessage(lines: Vector<Line> = Vector.empty()): Message {
  return new Message(lines);
}

/**
 * @tsplus operator fncts.test.data.Message +
 */
export function appendFragment(self: Message, fragment: Fragment): Message {
  return self | Message(Vector(Line(Vector(fragment))));
}

/**
 * @tsplus operator fncts.test.data.Message +
 */
export function prependFragment(fragment: Fragment, self: Message): Message {
  const lines = self.lines;
  if (self.lines.isNonEmpty()) {
    return Message(self.lines.tail.prepend(fragment + self.lines.unsafeHead!));
  } else {
    return Message(Vector(fragment.toLine));
  }
}

/**
 * @tsplus operator fncts.test.data.Message +
 */
export function concat(self: Message, that: Message): Message {
  return Message(self.lines.concat(that.lines));
}

/**
 * @tsplus operator fncts.test.data.Message |
 */
export function combine(self: Message, that: Message): Message {
  const last = self.lines.last;
  const head = that.lines.head;
  if (last.isJust() && head.isJust()) {
    return Message(self.lines.dropLast(1).append(last.value + head.value));
  } else {
    return self + that;
  }
}

/**
 * @tsplus pipeable fncts.test.data.Message drop
 */
export function drop(n: number) {
  return (self: Message): Message => {
    return Message(self.lines.drop(n));
  };
}

/**
 * @tsplus pipeable fncts.test.data.Message map
 */
export function map(f: (line: Line) => Line) {
  return (self: Message): Message => {
    return Message(self.lines.map(f));
  };
}

/**
 * @tsplus pipeable fncts.test.data.Message withOffset
 */
export function withOffset(offset: number) {
  return (self: Message): Message => {
    return self.map((line) => line.withOffset(offset));
  };
}

/**
 * @tsplus pipeable fncts.test.data.Message intersperse
 */
export function intersperse(line: Line) {
  return (self: Message): Message => {
    return new Message(
      Vector.from(
        self.lines.foldRight(List.empty<Line>(), (ln, rest) => Cons(ln, rest.isEmpty() ? Nil() : Cons(line, rest))),
      ),
    );
  };
}
