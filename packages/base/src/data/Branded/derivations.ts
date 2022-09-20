import type { Validation, Brand } from "@fncts/base/data/Branded/definition";
import type { Check } from "@fncts/typelevel/Check";

import { BrandedError, CompoundError } from "@fncts/base/data/DecodeError";
import { Decoder } from "@fncts/base/data/Decoder/definition";

/**
 * @tsplus derive fncts.Guard<_> 10
 */
export function deriveGuard<A extends Brand.Valid<any, any>>(
  ...[base, brands]: Check<Brand.IsValidated<A>> extends Check.True
    ? [
        base: Guard<Brand.Unbranded<A>>,
        brands: {
          [K in keyof A[Brand.valid] & string]: Validation<A[Brand.valid][K], K>;
        },
      ]
    : never
): Guard<A> {
  const validations = Object.values(brands) as ReadonlyArray<Validation<A, any>>;
  return Guard((u): u is A => base.is(u) && validations.every((brand) => brand.validate(u)));
}

/**
 * @tsplus derive fncts.Decoder<_> 10
 */
export function deriveDecoder<A extends Brand.Valid<any, any>>(
  ...[base, brands]: Check<Brand.IsValidated<A>> extends Check.True
    ? [
        base: Decoder<Brand.Unbranded<A>>,
        brands: {
          [K in (keyof A[Brand.valid]) & string]: Validation<A[Brand.valid][K], K>;
        },
      ]
    : never
): Decoder<A> {
  const label = "Brand<" + Object.keys(brands).join(" & ") + ">";
  return Decoder(
    (u) =>
      base.decode(u).match2(These.left, (warning, value) => {
        const failedBrands: Array<string> = [];
        for (const brand in brands) {
          if (!brands[brand]!.validate(value as any)) {
            failedBrands.push(brand);
          }
        }
        if (failedBrands.length > 0) {
          const error = new BrandedError(label, Vector.from(failedBrands));
          return warning.match(
            () => These.left(error),
            (warning) => These.left(new CompoundError(label, Vector(warning, error))),
          );
        }
        return These.rightOrBoth(warning, value);
      }),
    label,
  );
}
