export const VersionedTypeId = Symbol.for("fncts.io.Versioned");
export type VersionedTypeId = typeof VersionedTypeId;

export class Versioned<A> {
  readonly _typeId: VersionedTypeId = VersionedTypeId;
  constructor(readonly value: A) {}
}
