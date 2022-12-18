import type { Either } from "@fncts/base/data/Either";
import type { Maybe } from "@fncts/base/data/Maybe";
import type { UIO } from "@fncts/io/IO";
import type { Request } from "@fncts/query/Request";

import { Ref } from "@fncts/io/Ref";
import { Cache } from "@fncts/query/Cache/definition";

/**
 * @tsplus static fncts.query.CacheOps empty
 */
export function empty(__tsplusTrace?: string): UIO<Cache> {
  return IO(Cache.unsafeMake());
}

export class Default extends Cache {
  constructor(private readonly state: Ref<HashMap<any, any>>) {
    super();
  }
  get<E, A>(request: Request<E, A>, __tsplusTrace?: string | undefined): FIO<void, Ref<Maybe<Either<E, A>>>> {
    return this.state.get.map((map) => map.get(request)).just.orElseFail(undefined);
  }
  lookup<E, A extends Request<E, B>, B>(
    request: A,
    __tsplusTrace?: string | undefined,
  ): UIO<Either<Ref<Maybe<Either<E, B>>>, Ref<Maybe<Either<E, B>>>>> {
    return Ref.make(Nothing<Either<E, B>>()).flatMap((ref) => {
      return this.state.modify((map) =>
        map.get(request).match(
          () => [Left(ref), map.set(request, ref)],
          (ref) => [Right(ref), map],
        ),
      );
    });
  }
  put<E, A>(request: Request<E, A>, result: Ref<Maybe<Either<E, A>>>, __tsplusTrace?: string | undefined): UIO<void> {
    return this.state.update((map) => map.set(request, result));
  }
  remove<E, A>(request: Request<E, A>, __tsplusTrace?: string | undefined): UIO<void> {
    return this.state.update((map) => map.remove(request));
  }
}

/**
 * @tsplus static fncts.query.CacheOps unsafeMake
 */
export function unsafeMake(): Cache {
  return new Default(Ref.unsafeMake(HashMap.empty()));
}
