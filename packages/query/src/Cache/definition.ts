/**
 * @tsplus type fncts.query.Cache
 * @tsplus companion fncts.query.CacheOps
 */
export abstract class Cache {
  abstract get<E, A>(request: Request<E, A>, __tsplusTrace?: string): FIO<void, Ref<Maybe<Either<E, A>>>>;
  abstract lookup<E, A>(
    request: Request<E, A>,
    __tsplusTrace?: string,
  ): UIO<Either<Ref<Maybe<Either<E, A>>>, Ref<Maybe<Either<E, A>>>>>;
  abstract put<E, A>(request: Request<E, A>, result: Ref<Maybe<Either<E, A>>>, __tsplusTrace?: string): UIO<void>;
  abstract remove<E, A>(request: Request<E, A>, __tsplusTrace?: string): UIO<void>;
}
