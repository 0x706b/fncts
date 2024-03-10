export const enum EnvironmentPatchTag {
  AddService,
  RemoveService,
  UpdateService,
  Combine,
  Empty,
}

export const EnvironmentPatchVariance = Symbol.for("fncts.Environment.Patch.Variance");
export type EnvironmentPatchVariance = typeof EnvironmentPatchVariance;

export const EnvironmentPatchTypeId = Symbol.for("fncts.Environment.Patch");
export type EnvironmentPatchTypeId = typeof EnvironmentPatchTypeId;

/**
 * @tsplus type fncts.Environment.Patch
 * @tsplus companion fncts.Environment.PatchOps
 */
export abstract class EnvironmentPatch<In, Out> {
  readonly [EnvironmentPatchTypeId]: EnvironmentPatchTypeId = EnvironmentPatchTypeId;
  declare [EnvironmentPatchVariance]: {
    readonly _R: (_: In) => void;
    readonly _A: (_: never) => Out;
  };
}

export class AddService<Env, Service> extends EnvironmentPatch<Env, Env & Has<Service>> {
  readonly _tag = EnvironmentPatchTag.AddService;
  constructor(
    readonly service: Service,
    readonly tag: Tag<Service>,
  ) {
    super();
  }
}

export class Combine<In, Out, Out2> extends EnvironmentPatch<In, Out2> {
  readonly _tag = EnvironmentPatchTag.Combine;
  constructor(
    readonly first: EnvironmentPatch<In, Out>,
    readonly second: EnvironmentPatch<Out, Out2>,
  ) {
    super();
  }
}

export class Empty<Env> extends EnvironmentPatch<Env, Env> {
  readonly _tag = EnvironmentPatchTag.Empty;
}

export class RemoveService<Env, Service> extends EnvironmentPatch<Env & Has<Service>, Env> {
  readonly _tag = EnvironmentPatchTag.RemoveService;
  constructor(readonly tag: Tag<Service>) {
    super();
  }
}

export class UpdateService<Env, Service> extends EnvironmentPatch<Env & Has<Service>, Env & Has<Service>> {
  readonly _tag = EnvironmentPatchTag.UpdateService;
  constructor(
    readonly update: (_: Service) => Service,
    readonly tag: Tag<Service>,
  ) {
    super();
  }
}

export type Concrete =
  | AddService<any, any>
  | Combine<any, any, any>
  | Empty<any>
  | RemoveService<any, any>
  | UpdateService<any, any>;

/**
 * @tsplus macro remove
 */
export function concrete(_: EnvironmentPatch<any, any>): asserts _ is Concrete {
  //
}

/**
 * @tsplus tailRec
 */
function applyLoop(environment: Environment<any>, patches: List<EnvironmentPatch<any, any>>): Environment<any> {
  if (patches.isEmpty()) {
    return environment;
  }
  const head = patches.head;
  const tail = patches.tail;
  concrete(head);
  switch (head._tag) {
    case EnvironmentPatchTag.AddService:
      return applyLoop(environment.add(head.service, head.tag), tail);
    case EnvironmentPatchTag.Combine:
      return applyLoop(environment, Cons(head.first, Cons(head.second, tail)));
    case EnvironmentPatchTag.Empty:
      return applyLoop(environment, tail);
    case EnvironmentPatchTag.RemoveService:
      return applyLoop(environment, tail);
    case EnvironmentPatchTag.UpdateService:
      return applyLoop(environment.update(head.update, head.tag), tail);
  }
}

/**
 * @tsplus pipeable fncts.Environment.Patch __call
 */
export function apply<In>(environment: Environment<In>) {
  return <Out>(patch: EnvironmentPatch<In, Out>): Environment<Out> => {
    return applyLoop(environment, Cons(patch));
  };
}

/**
 * @tsplus pipeable fncts.Environment.Patch combine
 */
export function combine<Out, Out2>(that: EnvironmentPatch<Out, Out2>) {
  return <In>(self: EnvironmentPatch<In, Out>): EnvironmentPatch<In, Out2> => {
    return new Combine(self, that);
  };
}

/**
 * @tsplus static fncts.Environment.PatchOps diff
 */
export function diff<In, Out>(oldValue: Environment<In>, newValue: Environment<Out>): EnvironmentPatch<In, Out> {
  const sorted                   = newValue.map.toArray;
  const [missingServices, patch] = sorted.foldLeft(
    [oldValue.map.beginMutation, EnvironmentPatch.empty() as EnvironmentPatch<any, any>],
    ([map, patch], [tag, newService]) =>
      map.get(tag).match(
        () => [map.remove(tag), patch.combine(new AddService(newService, tag))],
        (oldService) => {
          if (oldService === newService) {
            return [map.remove(tag), patch];
          } else {
            return [map.remove(tag), patch.combine(new UpdateService((_: any) => newService, tag))];
          }
        },
      ),
  );
  return missingServices.foldLeftWithIndex(patch, (tag, patch) => patch.combine(new RemoveService(tag)));
}

/**
 * @tsplus static fncts.Environment.PatchOps empty
 */
export function empty<A>(): EnvironmentPatch<A, A> {
  return new Empty();
}
