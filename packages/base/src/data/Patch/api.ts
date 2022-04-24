import { Cons } from "@fncts/base/collection/immutable/List";
import { AddService, RemoveService, UpdateService } from "@fncts/base/data/Patch";
import { Patch } from "@fncts/base/data/Patch/definition";
import { Empty } from "@fncts/base/data/Patch/definition";
import { Compose } from "@fncts/base/data/Patch/definition";
import { concrete } from "@fncts/base/data/Patch/definition";

/**
 * @tsplus tailRec
 */
function applyLoop(environment: Environment<any>, patches: List<Patch<any, any>>): Environment<any> {
  if (patches.isEmpty()) {
    return environment;
  }
  const head = patches.head;
  const tail = patches.tail;
  concrete(head);
  switch (head._tag) {
    case "AddService":
      return applyLoop(environment.add(head.service, head.tag), tail);
    case "Compose":
      return applyLoop(environment, Cons(head.first, Cons(head.second, tail)));
    case "Empty":
      return applyLoop(environment, tail);
    case "RemoveService":
      return applyLoop(environment, tail);
    case "UpdateService":
      return applyLoop(environment.update(head.update, head.tag), tail);
  }
}

/**
 * @tsplus fluent fncts.Environment.Patch __call
 */
export function apply<In, Out>(patch: Patch<In, Out>, environment: Environment<In>): Environment<Out> {
  return applyLoop(environment, Cons(patch));
}

/**
 * @tsplus fluent fncts.Environment.Patch compose
 */
export function compose<In, Out, Out2>(self: Patch<In, Out>, that: Patch<Out, Out2>): Patch<In, Out2> {
  return new Compose(self, that);
}

const OrdEnvironmentMap = Number.Ord.contramap((_: readonly [Tag<unknown>, readonly [unknown, number]]) => _[1][1]);

/**
 * @tsplus static fncts.Environment.PatchOps diff
 */
export function diff<In, Out>(oldValue: Environment<In>, newValue: Environment<Out>): Patch<In, Out> {
  const sorted                   = newValue.map.asList.sort(OrdEnvironmentMap);
  const [missingServices, patch] = sorted.foldLeft(
    [oldValue.map, Patch.empty() as Patch<any, any>],
    ([map, patch], [tag, [newService, newIndex]]) =>
      map.get(tag).match(
        () => [map.remove(tag), patch.compose(new AddService(newService, tag))],
        ([oldService, oldIndex]) => {
          if (oldService === newService && oldIndex === newIndex) {
            return [map.remove(tag), patch];
          } else {
            return [map.remove(tag), patch.compose(new UpdateService((_: any) => newService, tag))];
          }
        },
      ),
  );
  return missingServices.foldLeftWithIndex(patch, (tag, patch) => patch.compose(new RemoveService(tag)));
}

/**
 * @tsplus static fncts.Environment.PatchOps empty
 */
export function empty<A>(): Patch<A, A> {
  return new Empty();
}
