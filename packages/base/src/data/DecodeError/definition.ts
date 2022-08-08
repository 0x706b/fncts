import { show } from "@fncts/base/typeclass/Showable";

export const DecodeErrorTypeId = Symbol.for("fncts.DecodeError");
export type DecodeErrorTypeId = typeof DecodeErrorTypeId;

export abstract class DecodeError {
  readonly _typeId: DecodeErrorTypeId = DecodeErrorTypeId;
  abstract render: Eval<RoseTree<string>>;
}

export class RequiredKeyError extends DecodeError {
  readonly _tag = "RequiredKey";
  constructor(readonly key: string, readonly error: DecodeError) {
    super();
  }
  render = Eval.defer(this.error.render.map((error) => RoseTree(`on required key ${this.key}`, Vector(error))));
}

export class OptionalKeyError extends DecodeError {
  readonly _tag = "OptionalKey";
  constructor(readonly key: PropertyKey, readonly error: DecodeError) {
    super();
  }
  render = Eval.defer(this.error.render.map((error) => RoseTree(`on optional key ${show(this.key)}`, Vector(error))));
}

export class RequiredIndexError<I, E extends DecodeError> extends DecodeError {
  readonly _tag = "RequiredIndex";
  constructor(readonly index: I, readonly error: E) {
    super();
  }
  render = Eval.defer(this.error.render.map((error) => RoseTree(`on required index ${this.index}`, Vector(error))));
}

export class OptionalIndexError<I, E extends DecodeError> extends DecodeError {
  readonly _tag = "RequiredIndex";
  constructor(readonly index: I, readonly error: E) {
    super();
  }
  render = Eval.defer(this.error.render.map((error) => RoseTree(`on optional index ${this.index}`, Vector(error))));
}

export class LazyError<E extends DecodeError> extends DecodeError {
  readonly _tag = "Lazy";
  constructor(readonly error: E) {
    super();
  }
  render = Eval.defer(this.error.render.map((error) => RoseTree("while decoding a lazy decoder", Vector(error))));
}

export class MemberError extends DecodeError {
  readonly _tag = "Member";
  constructor(readonly label: string, readonly error: DecodeError) {
    super();
  }
  render = Eval.defer(this.error.render.map((error) => RoseTree(`on member ${this.label}`, Vector(error))));
}

const vowels = ["a", "e", "i", "o", "u", "y"];

function startsWithVowel(s: string): boolean {
  for (let i = 0; i < vowels.length; i++) {
    if (s.startsWith(vowels[i]!)) return true;
  }
  return false;
}

export class CompoundError<E extends DecodeError> extends DecodeError {
  readonly _tag = "Compound";
  constructor(readonly name: string, readonly errors: Vector<E>) {
    super();
  }
  render = Eval.defer(
    this.errors
      .traverse(Eval.Applicative)((error) => error.render)
      .map((errors) =>
        RoseTree(
          `${this.errors.length} error(s) found while decoding ${startsWithVowel(this.name) ? "an" : "a"} ${this.name}`,
          errors,
        ),
      ),
  );
}

export class CompositionError<E extends DecodeError> extends DecodeError {
  readonly _tag = "Composition";
  constructor(readonly errors: Vector<E>) {
    super();
  }
  render = Eval.defer(
    this.errors
      .traverse(Eval.Applicative)((error) => error.render)
      .map((errors) =>
        errors.length === 1
          ? errors.unsafeGet(1)!
          : RoseTree(`${errors.length} errors found while decoding a composition`, errors),
      ),
  );
}

export class StringError extends DecodeError {
  readonly _tag = "String";
  constructor(readonly actual: unknown) {
    super();
  }
  render = Eval(RoseTree(cannotDecode(this.actual, "a string")));
}

export class NumberError extends DecodeError {
  readonly _tag = "Number";
  constructor(readonly actual: unknown) {
    super();
  }
  render = Eval(RoseTree(cannotDecode(this.actual, "a number")));
}

export class NaNError extends DecodeError {
  readonly _tag = "NaN";
  render        = Eval.now(RoseTree("value is NaN"));
}

export class InfinityError extends DecodeError {
  readonly _tag = "Infinity";
  render        = Eval(RoseTree("value is Infinity"));
}

export class BooleanError extends DecodeError {
  readonly _tag = "Boolean";
  constructor(readonly actual: unknown) {
    super();
  }
  render = Eval(RoseTree(cannotDecode(this.actual, "a boolean")));
}

export class PrimitiveError extends DecodeError {
  readonly _tag = "Primitive";
  constructor(readonly actual: unknown, readonly name: string) {
    super();
  }
  render = Eval(RoseTree(cannotDecode(this.actual, this.name)));
}

export class LiteralError<A extends string | number | boolean> extends DecodeError {
  readonly _tag = "Literal";
  constructor(readonly actual: unknown, readonly literals: Vector<A>) {
    super();
  }
  render = Eval(
    RoseTree(cannotDecode(this.actual, `one of ${this.literals.map((literal) => show(literal)).join(", ")}`)),
  );
}

export class UnexpectedKeysError extends DecodeError {
  readonly _tag = "UnexpectedKeys";
  constructor(readonly keys: Vector<string>) {
    super();
  }
  render = Eval(
    RoseTree(
      `${this.keys.length} error(s) found while checking keys`,
      this.keys.map((key) => RoseTree(`unexpected key ${show(key)}`)),
    ),
  );
}

export class UnexpectedIndicesError extends DecodeError {
  readonly _tag = "UnexpectedIndices";
  constructor(readonly indices: Vector<number>) {
    super();
  }
  render = Eval(
    RoseTree(
      `${this.indices.length} error(s) found while checking indices`,
      this.indices.map((index) => RoseTree(`unexpected index ${show(index)}`)),
    ),
  );
}

export class MissingKeyError extends DecodeError {
  readonly _tag = "MissingKeys";
  constructor(readonly key: PropertyKey) {
    super();
  }
  render = Eval(RoseTree(`missing required key ${show(this.key)}`));
}

export class MissingIndicesError extends DecodeError {
  readonly _tag = "MissingIndices";
  constructor(readonly keys: Vector<PropertyKey>) {
    super();
  }
  render = Eval(
    RoseTree(
      `${this.keys.length} error(s) found while checking indices`,
      this.keys.map((key) => RoseTree(`missing required index ${show(key)}`)),
    ),
  );
}

function cannotDecode(u: unknown, expected: string): string {
  return `cannot decode ${show(u)}, expected ${expected}`;
}

export class BrandedError extends DecodeError {
  readonly _tag = "BrandedError";
  constructor(readonly name: string, readonly brands: Vector<string>) {
    super();
  }
  render = Eval(
    RoseTree(
      `${this.brands.length} brand(s) failed to be validated while decoding ${this.name}`,
      this.brands.map((brand) => RoseTree(brand)),
    ),
  );
}

export class UnionError extends DecodeError {
  readonly _tag = "UnionError";
  constructor(readonly label: string, readonly errors: Vector<DecodeError>) {
    super();
  }
  render = Eval.defer(
    this.errors
      .traverse(Eval.Applicative)((error) => error.render)
      .map((errors) => RoseTree(`${this.errors.length} error(s) found while decoding ${this.label}`, errors)),
  );
}

export class EmptyError extends DecodeError {
  readonly _tag = "EmptyError";
  constructor(readonly actual: unknown) {
    super();
  }
  render = Eval(RoseTree(cannotDecode(this.actual, "a collection containing at least one element")));
}
