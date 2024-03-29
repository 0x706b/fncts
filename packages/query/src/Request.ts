import type { ShowComputationExternal } from "@fncts/base/data/Showable";

import { CaseClassTypeId } from "@fncts/base/data/CaseClass";
import { showComputationComplex, showProperty } from "@fncts/base/data/Showable";

export const RequestTypeId = Symbol.for("fncts.query.Request");
export type RequestTypeId = typeof RequestTypeId;

export const RequestVariance = Symbol.for("fncts.query.Request.Variance");
export type RequestVariance = typeof RequestVariance;

export abstract class Request<E, A> {
  readonly [RequestTypeId]: RequestTypeId = RequestTypeId;
  declare [RequestVariance]: {
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
}

const simpleRequestHash = Hashable.string("fncts.query.Request.SimpleRequest");

// @ts-expect-error
export abstract class SimpleRequest<X extends Record<PropertyKey, any>, E, A> extends CaseClass<X> {
  readonly [RequestTypeId]: RequestTypeId = RequestTypeId;
  declare [RequestVariance]: {
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };

  get [Symbol.hash](): number {
    return this[CaseClassTypeId].foldLeft(simpleRequestHash, (acc, k) =>
      Hashable.combine(acc, Hashable.unknown(this[k])),
    );
  }

  [Symbol.equals](that: unknown): boolean {
    return Hashable.unknown(this) === Hashable.unknown(that);
  }

  get [Symbol.showable](): ShowComputationExternal {
    return showComputationComplex({
      base: Pure.succeedNow(`Request (${this.constructor.name})`),
      braces: ["{", "}"],
      keys: this[CaseClassTypeId].traverse(Pure.Applicative)((key) => showProperty(this, key, 0)).map(Conc.from),
    });
  }
}

export declare namespace Request {
  type ErrorOf<X> = [X] extends [{ [RequestVariance]: { _E: (_: never) => infer E } }] ? E : never;
  type ValueOf<X> = [X] extends [{ [RequestVariance]: { _A: (_: never) => infer A } }] ? A : never;
}
