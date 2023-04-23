import type { unset } from "ts-pattern/dist/internals/symbols";
import type { Match } from "ts-pattern/dist/types/Match";

import { match as _match } from "ts-pattern";

/**
 * @tsplus getter global match
 */
export const match: {
  <input, output = unset>(value: input): Match<input, output>;
  <input extends [any, ...any], output = unset>(value: input): Match<input, output>;
} = _match;

export { isMatching, P, Pattern } from "ts-pattern";
