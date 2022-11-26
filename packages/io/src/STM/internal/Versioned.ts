export const VersionedTypeId = Symbol.for("fncts.io.Versioned");
export type VersionedTypeId = typeof VersionedTypeId;

export class Versioned<A> {
  readonly [VersionedTypeId]: VersionedTypeId = VersionedTypeId;
  constructor(readonly value: A) {}
}
