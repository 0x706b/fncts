import { Fragment } from "./Fragment.js";
import { Message } from "./Message.js";

/**
 * @tsplus type fncts.test.data.Line
 * @tsplus companion fncts.test.data.LineOps
 */
export class Line {
  constructor(readonly fragments: Vector<Fragment> = Vector.empty(), readonly offset = 0) {}
}

/**
 * @tsplus static fncts.test.data.LineOps empty
 */
export const empty = Line();

/**
 * @tsplus static fncts.test.data.LineOps fromString
 */
export function fromString(text: string, offset = 0): Line {
  return Fragment(text).toLine.withOffset(offset);
}

/**
 * @tsplus static fncts.test.data.LineOps __call
 */
export function makeLine(fragments: Vector<Fragment> = Vector.empty(), offset = 0): Line {
  return new Line(fragments, offset);
}

/**
 * @tsplus operator fncts.test.data.Line +
 */
export function append(self: Line, that: Line): Line {
  return new Line(self.fragments.concat(that.fragments), self.offset);
}

/**
 * @tsplus operator fncts.test.data.Line |
 */
export function concat(self: Line, that: Line): Message {
  return new Message(Vector(self, that));
}

/**
 * @tsplus operator fncts.test.data.Line +
 */
export function appendTo(message: Message, self: Line): Message {
  return new Message(message.lines.append(self));
}

/**
 * @tsplus operator fncts.test.data.Line +
 */
export function prependTo(self: Line, message: Message): Message {
  return new Message(message.lines.prepend(self));
}

/**
 * @tsplus pipeable fncts.test.data.Line withOffset
 */
export function withOffset(shift: number) {
  return (self: Line): Line => {
    return new Line(self.fragments, self.offset + shift);
  };
}

/**
 * @tsplus getter fncts.test.data.Line toMessage
 */
export function toMessage(self: Line): Message {
  return new Message(Vector(self));
}

/**
 * @tsplus getter fncts.test.data.Line optimized
 */
export function optimized(self: Line): Line {
  const newFragments = self.fragments.foldRight(List.empty<Fragment>(), (curr, rest) => {
    if (rest.isNonEmpty()) {
      const next = rest.head;
      const fs   = rest.tail;
      if (curr.style === next.style) {
        return Cons(Fragment(curr.text + next.text), fs);
      } else {
        return Cons(curr, Cons(next, fs));
      }
    } else {
      return Cons(curr);
    }
  });
  return Line(Vector.from(newFragments), self.offset);
}
