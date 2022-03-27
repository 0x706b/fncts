import type { FloatConstraints, NumberConstraints } from "../constraints.js";
import type { Random } from "@fncts/base/control/Random";
import type { Has } from "@fncts/base/prelude";

import { indexToFloat, MAX_VALUE_32, safeFloatToIndex } from "../../../util/math.js";
import { Gen } from "../definition.js";

/**
 * @tsplus static fncts.test.control.GenOps float
 */
export function float(
  constraints: NumberConstraints & FloatConstraints = {},
): Gen<Has<Random>, number> {
  const {
    noDefaultInfinity = false,
    min = noDefaultInfinity ? -MAX_VALUE_32 : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? MAX_VALUE_32 : Number.POSITIVE_INFINITY,
    noNaN = false,
  } = constraints;
  return Gen.unwrap(
    IO.gen(function* (_) {
      const minIndex = yield* _(safeFloatToIndex(min, "min"));
      const maxIndex = yield* _(safeFloatToIndex(max, "max"));
      if (minIndex > maxIndex) {
        return yield* _(
          IO.haltNow(
            new Error("Gen.float constraints.min must be less than or equal to constraints.max"),
          ),
        );
      }
      if (noNaN) {
        return Gen.int({ min: minIndex, max: maxIndex }).map(indexToFloat);
      }
      const minIndexWithNaN = maxIndex > 0 ? minIndex : minIndex - 1;
      const maxIndexWithNaN = maxIndex > 0 ? maxIndex + 1 : maxIndex;
      return Gen.int({ min: minIndexWithNaN, max: maxIndexWithNaN }).map((index) => {
        if (index > maxIndex || index < minIndex) return Number.NaN;
        else return indexToFloat(index);
      });
    }),
  );
}
