import { Vector } from "@fncts/base/collection/immutable/Vector.js";

import { Line } from "./Line.js";
import { Style } from "./Style.js";

/**
 * @tsplus type fncts.test.data.Fragment
 * @tsplus companion fncts.test.data.FragmentOps
 */
export class Fragment {
  constructor(readonly text: string, readonly style: Style = Style.Default) {}
}

/**
 * @tsplus static fncts.test.data.FragmentOps __call
 */
export function makeFragment(text: string, style = Style.Default): Fragment {
  return new Fragment(text, style);
}

/**
 * @tsplus operator fncts.test.data.Fragment +
 */
export function appendTo(line: Line, self: Fragment): Line {
  return new Line(line.fragments.append(self), line.offset);
}

/**
 * @tsplus operator fncts.test.data.Fragment +
 */
export function prependTo(self: Fragment, line: Line): Line {
  return new Line(line.fragments.prepend(self), line.offset);
}

/**
 * @tsplus operator fncts.test.data.Fragment +
 */
export function append(self: Fragment, that: Fragment): Line {
  return new Line(Vector(self, that));
}

/**
 * @tsplus getter fncts.test.data.Fragment toLine
 */
export function toLine(self: Fragment): Line {
  return new Line(Vector(self));
}

/**
 * @tsplus getter fncts.test.data.Fragment bold
 */
export function bold(self: Fragment): Fragment {
  return new Fragment(self.text, Style.Bold(self));
}

/**
 * @tsplus getter fncts.test.data.Fragment underlined
 */
export function underlined(self: Fragment): Fragment {
  return new Fragment(self.text, Style.Underlined(self));
}
