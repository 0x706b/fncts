import type { AssertionValue } from "../AssertionValue.js";
import type { Cause } from "@fncts/base/data/Cause.js";

import { List, Nil } from "@fncts/base/collection/immutable/List.js";
import { Cons } from "@fncts/base/collection/immutable/List.js";
import { Vector } from "@fncts/base/collection/immutable/Vector";
import { Just, Nothing } from "@fncts/base/data/Maybe.js";

import { TestTimeoutException } from "../TestTimeoutException.js";
import { detail, primary, withOffset } from "./api.js";
import { Style } from "./Style.js";

export class Message {
  constructor(readonly lines: Vector<Line> = Vector.empty()) {}

  ["+:"](line: Line): Message {
    return new Message(this.lines.prepend(line));
  }
  [":+"](line: Line): Message {
    return new Message(this.lines.append(line));
  }
  ["++"](message: Message): Message {
    return new Message(this.lines.concat(message.lines));
  }
  ["+++"](message: Message): Message {
    const last = this.lines.last;
    const head = message.lines.head;
    if (last.isJust() && head.isJust()) {
      return new Message(this.lines.dropLast(1).append(last.value["++"](head.value)))["++"](
        new Message(message.lines.drop(1)),
      );
    }
    return this["++"](message);
  }
  drop(n: number): Message {
    return new Message(this.lines.drop(n));
  }
  map(f: (line: Line) => Line): Message {
    return new Message(this.lines.map(f));
  }
  withOffset(offset: number): Message {
    return new Message(this.lines.map((l) => l.withOffset(offset)));
  }
  intersperse(line: Line) {
    return new Message(
      Vector.from(
        this.lines.foldRight(List.empty<Line>(), (ln, rest) =>
          Cons(ln, rest.isEmpty() ? Nil() : Cons(line, rest)),
        ),
      ),
    );
  }
  static empty = new Message();
}

export class Line {
  constructor(readonly fragments: Vector<Fragment> = Vector.empty(), readonly offset: number = 0) {}

  [":+"](fragment: Fragment): Line {
    return new Line(this.fragments.append(fragment));
  }
  ["+:"](fragment: Fragment): Line {
    return new Line(this.fragments.prepend(fragment));
  }
  prepend(this: Line, message: Message): Message {
    return new Message(message.lines.prepend(this));
  }
  ["+"](fragment: Fragment): Line {
    return new Line(this.fragments.append(fragment));
  }
  ["+|"](line: Line): Message {
    return new Message(Vector(this, line));
  }
  ["++"](line: Line): Line {
    return new Line(this.fragments.concat(line.fragments), this.offset);
  }
  withOffset(shift: number): Line {
    return new Line(this.fragments, this.offset + shift);
  }
  toMessage(): Message {
    return new Message(Vector(this));
  }

  static fromString(text: string, offset = 0): Line {
    return new Fragment(text).toLine().withOffset(offset);
  }

  static empty = new Line();
}

export class Fragment {
  constructor(readonly text: string, readonly style: Style = Style.Default) {}

  ["+:"](line: Line): Line {
    return this.prependTo(line);
  }
  prependTo(this: Fragment, line: Line): Line {
    return new Line(line.fragments.prepend(this), line.offset);
  }
  ["+"](f: Fragment): Line {
    return new Line(Vector(this, f));
  }
  toLine(): Line {
    return new Line(Vector(this));
  }
  get bold(): Fragment {
    return new Fragment(this.text, Style.Bold(this));
  }
  get underlined(): Fragment {
    return new Fragment(this.text, Style.Underlined(this));
  }
  ansi(ansiColor: string): Fragment {
    return new Fragment(this.text, Style.Ansi(this, ansiColor));
  }
}
