import type { FloatConstraints, NumberConstraints } from "../constraints.js";
import type { ArrayInt64 } from "@fncts/base/util/rand";

import { Random } from "@fncts/base/control/Random";
import { Stream } from "@fncts/base/control/Stream";
import { IllegalArgumentError } from "@fncts/base/data/exceptions";

import {
  add64,
  computeArrayInt64GenerateRange,
  indexToDouble,
  isStrictlyPositive64,
  isStrictlySmaller64,
  safeDoubleToIndex,
  substract64,
  Unit64,
} from "../../../util/math.js";
import { Sample } from "../../Sample.js";
import { Gen } from "../definition.js";

/**
 * @tsplus static fncts.test.control.GenOps arrayInt64
 */
export function arrayInt64(min: ArrayInt64, max: ArrayInt64): Gen<Has<Random>, ArrayInt64> {
  return new Gen(
    Stream.fromIO(computeArrayInt64GenerateRange(min, max, undefined, undefined))
      .chain(({ min, max }) => Stream.repeatIO(Random.nextArrayIntBetween(min, max)))
      .map((uncheckedValue) => {
        if (uncheckedValue.data.length === 1) {
          uncheckedValue.data.unshift(0);
        }
        return Just(Sample.shrinkArrayInt64(min)(uncheckedValue as ArrayInt64));
      }),
  );
}

/**
 * @tsplus static fncts.test.control.GenOps double
 */
export function double(constraints: NumberConstraints & FloatConstraints = {}): Gen<Has<Random>, number> {
  const {
    noDefaultInfinity = false,
    noNaN = false,
    min = noDefaultInfinity ? -Number.MAX_VALUE : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? Number.MAX_VALUE : Number.POSITIVE_INFINITY,
  } = constraints;
  return Gen.unwrap(
    IO.gen(function* (_) {
      const minIndex = yield* _(safeDoubleToIndex(min, "min"));
      const maxIndex = yield* _(safeDoubleToIndex(max, "max"));
      if (isStrictlySmaller64(maxIndex, minIndex)) {
        return yield* _(IO.haltNow(new IllegalArgumentError("min must be less than or equal to max", "Gen.double")));
      }
      if (noNaN) {
        return arrayInt64(minIndex, maxIndex).map(indexToDouble);
      }
      const positiveMaxIdx  = isStrictlyPositive64(maxIndex);
      const minIndexWithNaN = positiveMaxIdx ? minIndex : substract64(minIndex, Unit64);
      const maxIndexWithNaN = positiveMaxIdx ? add64(maxIndex, Unit64) : maxIndex;
      return arrayInt64(minIndexWithNaN, maxIndexWithNaN).map((index) => {
        if (isStrictlySmaller64(maxIndex, index) || isStrictlySmaller64(index, minIndex)) return Number.NaN;
        else return indexToDouble(index);
      });
    }),
  );
}
