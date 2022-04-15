import type { Gen } from "./definition.js";
import type { Eq } from "@fncts/base/typeclass";

export interface LengthConstraints {
  minLength?: number;
  maxLength?: number;
}

export interface EqConstraint<A> {
  eq?: Eq<A>;
}

export interface DateConstraints {
  min?: Date;
  max?: Date;
}

export interface ObjectConstraints {
  maxDepth?: number;
  maxKeys?: number;
  key?: Gen<any, string>;
  values?: Gen<any, any>[];
  withSet?: boolean;
  withMap?: boolean;
  withBigint?: boolean;
  withDate?: boolean;
  withTypedArray?: boolean;
}

export interface NumberConstraints {
  min?: number;
  max?: number;
}

export interface FloatConstraints {
  noDefaultInfinity?: boolean;
  noNaN?: boolean;
}
