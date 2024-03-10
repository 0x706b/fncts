import type { Validation } from "@fncts/base/data/Branded";

export const ASTAnnotationVariance = Symbol.for("fncts.schema.ASTAnnotation.Variance");
export type ASTAnnotationVariance = typeof ASTAnnotationVariance;

export const ASTAnnotationTypeId = Symbol.for("fncts.schema.ASTAnnotation");
export type ASTAnnotationTypeId = typeof ASTAnnotationTypeId;

/**
 * @tsplus type fncts.schema.ASTAnnotation
 * @tsplus companion fncts.schema.ASTAnnotationOps
 */
export class ASTAnnotation<V> implements Hashable, Equatable {
  readonly [ASTAnnotationTypeId]: ASTAnnotationTypeId = ASTAnnotationTypeId;
  declare [ASTAnnotationVariance]: {
    readonly _V: (_: never) => V;
  };
  constructor(
    readonly tag: Tag<V>,
    readonly identifier: string,
    readonly combine: (v1: V, v2: V) => V,
  ) {}
  get [Symbol.hash]() {
    return Hashable.combine(Hashable.string(this.identifier), Hashable.unknown(this.tag));
  }
  [Symbol.equals](that: unknown) {
    return isASTAnnotation(that) && Equatable.strictEquals(this.tag, that.tag) && this.identifier === that.identifier;
  }
}

export function isASTAnnotation(u: unknown): u is ASTAnnotation<unknown> {
  return isObject(u) && ASTAnnotationTypeId in u;
}

export const TitleTag = Tag<string>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps Title
 */
export const Title = new ASTAnnotation(TitleTag, "Title", (_, a) => a);

export const IdentifierTag = Tag<string>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps Identifier
 */
export const Identifier = new ASTAnnotation(IdentifierTag, "Identifier", (_, a) => a);

export const DescriptionTag = Tag<string>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps Description
 */
export const Description = new ASTAnnotation(DescriptionTag, "Description", (_, a) => a);

export const MessageTag = Tag<(_: unknown) => string>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps Message
 */
export const Message = new ASTAnnotation(MessageTag, "Message", (_, a) => a);

export const BrandTag = Tag<Vector<Validation<any, any>>>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps Brand
 */
export const Brand = new ASTAnnotation(BrandTag, "Brand", (a, b) => a.concat(b));

export const OptionalTag = Tag<boolean>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps Optional
 */
export const Optional = new ASTAnnotation(OptionalTag, "Optional", (_, b) => b);

export const ParseOptionalTag = Tag<boolean>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps ParseOptional
 */
export const ParseOptional = new ASTAnnotation(ParseOptionalTag, "ParseOptional", (_, b) => b);

export type Hook<A> = (...typeParameters: ReadonlyArray<A>) => A;

export function hook(handler: (...typeParameters: ReadonlyArray<any>) => any): Hook<any> {
  return handler;
}

export const ParserHookTag = Tag<Hook<any>>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps ParserHook
 */
export const ParserHook = new ASTAnnotation(ParserHookTag, "ParserHook", (_, b) => b);

export const GenHookTag = Tag<Hook<any>>();

/**
 * @tsplus static fncts.schema.ASTAnnotationOps GenHook
 */
export const GenHook = new ASTAnnotation(GenHookTag, "GenHook", (_, b) => b);
