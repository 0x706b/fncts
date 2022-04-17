export const PatchTypeId = Symbol.for("fncts.Patch");
export type PatchTypeId = typeof PatchTypeId;

/**
 * @tsplus type fncts.Environment.Patch
 * @tsplus companion fncts.Environment.PatchOps
 */
export abstract class Patch<In, Out> {
  readonly _typeId: PatchTypeId = PatchTypeId;
  readonly _R!: (_: In) => void;
  readonly _A!: () => Out;
}

export class AddService<Env, Service> extends Patch<Env, Env & Has<Service>> {
  readonly _tag = "AddService";
  constructor(readonly service: Service, readonly tag: Tag<Service>) {
    super();
  }
}

export class Compose<In, Out, Out2> extends Patch<In, Out2> {
  readonly _tag = "Compose";
  constructor(readonly first: Patch<In, Out>, readonly second: Patch<Out, Out2>) {
    super();
  }
}

export class Empty<Env> extends Patch<Env, Env> {
  readonly _tag = "Empty";
}

export class RemoveService<Env, Service> extends Patch<Env & Has<Service>, Env> {
  readonly _tag = "RemoveService";
  constructor(readonly tag: Tag<Service>) {
    super();
  }
}

export class UpdateService<Env, Service> extends Patch<Env & Has<Service>, Env & Has<Service>> {
  readonly _tag = "UpdateService";
  constructor(readonly update: (_: Service) => Service, readonly tag: Tag<Service>) {
    super();
  }
}

export type Concrete =
  | AddService<any, any>
  | Compose<any, any, any>
  | Empty<any>
  | RemoveService<any, any>
  | UpdateService<any, any>;

/**
 * @tsplus macro remove
 */
export function concrete(_: Patch<any, any>): asserts _ is Concrete {
  //
}
