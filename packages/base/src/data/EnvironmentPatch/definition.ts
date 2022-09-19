export const EnvironmentPatchTypeId = Symbol.for("fncts.Environment.Patch");
export type EnvironmentPatchTypeId = typeof EnvironmentPatchTypeId;

/**
 * @tsplus type fncts.Environment.Patch
 * @tsplus companion fncts.Environment.PatchOps
 */
export abstract class EnvironmentPatch<In, Out> {
  readonly _typeId: EnvironmentPatchTypeId = EnvironmentPatchTypeId;
  readonly _R!: (_: In) => void;
  readonly _A!: () => Out;
}

export class AddService<Env, Service> extends EnvironmentPatch<Env, Env & Has<Service>> {
  readonly _tag = "AddService";
  constructor(readonly service: Service, readonly tag: Tag<Service>) {
    super();
  }
}

export class Compose<In, Out, Out2> extends EnvironmentPatch<In, Out2> {
  readonly _tag = "Compose";
  constructor(readonly first: EnvironmentPatch<In, Out>, readonly second: EnvironmentPatch<Out, Out2>) {
    super();
  }
}

export class Empty<Env> extends EnvironmentPatch<Env, Env> {
  readonly _tag = "Empty";
}

export class RemoveService<Env, Service> extends EnvironmentPatch<Env & Has<Service>, Env> {
  readonly _tag = "RemoveService";
  constructor(readonly tag: Tag<Service>) {
    super();
  }
}

export class UpdateService<Env, Service> extends EnvironmentPatch<Env & Has<Service>, Env & Has<Service>> {
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
export function concrete(_: EnvironmentPatch<any, any>): asserts _ is Concrete {
  //
}
