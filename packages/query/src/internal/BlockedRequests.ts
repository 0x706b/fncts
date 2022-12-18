import type { Sequential } from "./Sequential.js";
import type { DataSource } from "@fncts/query/DataSource";
import type { Described } from "@fncts/query/Described";
import type { BlockedRequest } from "@fncts/query/internal/BlockedRequest";

import { Parallel } from "./Parallel.js";

export const BlockedRequestsTypeId = Symbol.for("fncts.query.BlockedRequests");
export type BlockedRequestsTypeId = typeof BlockedRequestsTypeId;

export const BlockedRequestsVariance = Symbol.for("fncts.query.BlockedRequests.Variance");
export type BlockedRequestsVariance = typeof BlockedRequestsVariance;

/**
 * @tsplus type fncts.query.BlockedRequests
 * @tsplus companion fncts.query.BlockedRequestsOps
 */
export abstract class BlockedRequests<R> {
  readonly [BlockedRequestsTypeId]: BlockedRequestsTypeId = BlockedRequestsTypeId;
  declare [BlockedRequestsVariance]: {
    readonly _R: (_: never) => R;
  };
}

export const enum BlockedRequestsTag {
  Empty,
  Single,
  Then,
  Both,
}

export class Empty extends BlockedRequests<never> {
  readonly _tag = BlockedRequestsTag.Empty;
}

export class Single<R, A> extends BlockedRequests<R> {
  readonly _tag = BlockedRequestsTag.Single;
  constructor(readonly dataSource: DataSource<R, A>, readonly blockedRequest: BlockedRequest<A>) {
    super();
  }
}

export class Then<R> extends BlockedRequests<R> {
  readonly _tag = BlockedRequestsTag.Then;
  constructor(readonly left: BlockedRequests<R>, readonly right: BlockedRequests<R>) {
    super();
  }
}

export class Both<R> extends BlockedRequests<R> {
  readonly _tag = BlockedRequestsTag.Both;
  constructor(readonly left: BlockedRequests<R>, readonly right: BlockedRequests<R>) {
    super();
  }
}

const _Empty = new Empty();

/**
 * @tsplus static fncts.query.BlockedRequestsOps empty
 */
export function empty<R>(): BlockedRequests<R> {
  return _Empty;
}

/**
 * @tsplus static fncts.query.BlockedRequestsOps single
 */
export function single<R, A>(dataSource: DataSource<R, A>, blockedRequest: BlockedRequest<A>): BlockedRequests<R> {
  return new Single(dataSource, blockedRequest);
}

/**
 * @tsplus static fncts.query.BlockedRequestsOps then
 */
export function then<R>(left: BlockedRequests<R>, right: BlockedRequests<R>): BlockedRequests<R> {
  return new Then(left, right);
}

/**
 * @tsplus static fncts.query.BlockedRequestsOps both
 */
export function both<R>(left: BlockedRequests<R>, right: BlockedRequests<R>): BlockedRequests<R> {
  return new Both(left, right);
}

type Concrete<R> = Empty | Single<R, any> | Then<R> | Both<R>;

function concrete<R>(_: BlockedRequests<R>): asserts _ is Concrete<R> {
  //
}

export abstract class BlockedRequestsFolder<R, Z> {
  abstract readonly emptyCase: Z;
  abstract singleCase<A>(dataSource: DataSource<R, A>, blockedRequest: BlockedRequest<A>): Z;
  abstract bothCase(left: Z, right: Z): Z;
  abstract thenCase(left: Z, right: Z): Z;
}

/**
 * @tsplus pipeable fncts.query.BlockedRequests fold
 */
export function fold<R, Z>(folder: BlockedRequestsFolder<R, Z>) {
  return (self: BlockedRequests<R>): Z => {
    return foldLoop(folder, Cons(self), List.empty()).unsafeHead;
  };
}

const enum BlockedRequestsCase {
  BothCase,
  ThenCase,
}
/**
 * @tsplus tailRef
 */
function foldLoop<R, Z>(
  folder: BlockedRequestsFolder<R, Z>,
  inp: List<BlockedRequests<R>>,
  out: List<Either<BlockedRequestsCase, Z>>,
): List<Z> {
  if (inp.isEmpty()) {
    return out.foldLeft(List.empty(), (acc, r) =>
      r.match(
        (c) => {
          const left            = acc.unsafeHead;
          const right           = acc.unsafeTail.unsafeHead;
          const blockedRequests = acc.unsafeTail.unsafeTail;
          switch (c) {
            case BlockedRequestsCase.BothCase: {
              return Cons(folder.bothCase(left, right), blockedRequests);
            }
            case BlockedRequestsCase.ThenCase: {
              return Cons(folder.thenCase(left, right), blockedRequests);
            }
          }
        },
        (z) => Cons(z, acc),
      ),
    );
  } else {
    const head = inp.head;
    concrete(head);
    switch (head._tag) {
      case BlockedRequestsTag.Empty: {
        return foldLoop(folder, inp.tail, Cons(Right(folder.emptyCase), out));
      }
      case BlockedRequestsTag.Single: {
        return foldLoop(folder, inp.tail, Cons(Right(folder.singleCase(head.dataSource, head.blockedRequest)), out));
      }
      case BlockedRequestsTag.Both: {
        return foldLoop(
          folder,
          Cons(head.left, Cons(head.right, inp.tail)),
          Cons(Left(BlockedRequestsCase.BothCase), out),
        );
      }
      case BlockedRequestsTag.Then: {
        return foldLoop(
          folder,
          Cons(head.left, Cons(head.right, inp.tail)),
          Cons(Left(BlockedRequestsCase.ThenCase), out),
        );
      }
    }
  }
}

export class MapDataSources<R> extends BlockedRequestsFolder<R, BlockedRequests<R>> {
  constructor(readonly f: DataSourceAspect<R>) {
    super();
  }
  emptyCase: BlockedRequests<R> = new Empty();
  singleCase<A>(dataSource: DataSource<R, A>, blockedRequest: BlockedRequest<A>): BlockedRequests<R> {
    return new Single(this.f.apply(dataSource), blockedRequest);
  }
  bothCase(left: BlockedRequests<R>, right: BlockedRequests<R>): BlockedRequests<R> {
    return new Both(left, right);
  }
  thenCase(left: BlockedRequests<R>, right: BlockedRequests<R>): BlockedRequests<R> {
    return new Then(left, right);
  }
}

/**
 * @tsplus pipeable fncts.query.BlockedRequests mapDataSources
 */
export function mapDataSources<R1>(f: DataSourceAspect<R1>) {
  return <R>(self: BlockedRequests<R>): BlockedRequests<R | R1> => {
    return self.fold(new MapDataSources<R | R1>(f));
  };
}

export class ContramapEnvironment<R0, R> extends BlockedRequestsFolder<R, BlockedRequests<R0>> {
  constructor(readonly f: Described<(_: Environment<R0>) => Environment<R>>) {
    super();
  }
  emptyCase: BlockedRequests<R0> = new Empty();
  singleCase<A>(dataSource: DataSource<R, A>, blockedRequest: BlockedRequest<A>): BlockedRequests<R0> {
    return new Single(dataSource.contramapEnvironment(this.f), blockedRequest);
  }
  bothCase(left: BlockedRequests<R0>, right: BlockedRequests<R0>): BlockedRequests<R0> {
    return new Both(left, right);
  }
  thenCase(left: BlockedRequests<R0>, right: BlockedRequests<R0>): BlockedRequests<R0> {
    return new Then(left, right);
  }
}

/**
 * @tsplus pipeable fncts.query.BlockedRequests contramapEnvironment
 */
export function contramapEnvironment<R0, R>(
  f: Described<(_: Environment<R0>) => Environment<R>>,
  __tsplusTrace?: string,
) {
  return (self: BlockedRequests<R>): BlockedRequests<R0> => {
    return self.fold(new ContramapEnvironment(f));
  };
}

/**
 * @tsplus getter fncts.query.BlockedRequests step
 */
export function step<R>(c: BlockedRequests<R>): readonly [Parallel<R>, List<BlockedRequests<R>>] {
  return stepLoop(c, List.empty(), Parallel.empty, List.empty());
}

/**
 * @tsplus tailRec
 */
function stepLoop<R>(
  blockedRequests: BlockedRequests<R>,
  stack: List<BlockedRequests<R>>,
  parallel: Parallel<R>,
  sequential: List<BlockedRequests<R>>,
): readonly [Parallel<R>, List<BlockedRequests<R>>] {
  concrete(blockedRequests);
  switch (blockedRequests._tag) {
    case BlockedRequestsTag.Empty: {
      if (stack.isEmpty()) return [parallel, sequential];
      else return stepLoop(stack.head, stack.tail, parallel, sequential);
    }
    case BlockedRequestsTag.Then: {
      concrete(blockedRequests.left);
      const { left, right } = blockedRequests;
      switch (left._tag) {
        case BlockedRequestsTag.Empty:
          return stepLoop(right, stack, parallel, sequential);
        case BlockedRequestsTag.Then:
          return stepLoop(new Then(left.left, new Then(left.right, right)), stack, parallel, sequential);
        case BlockedRequestsTag.Both:
          return stepLoop(
            new Both(new Then(left.left, right), new Then(left.right, right)),
            stack,
            parallel,
            sequential,
          );
        case BlockedRequestsTag.Single:
          return stepLoop(left, stack, parallel, Cons(right, sequential));
      }
    }
    case BlockedRequestsTag.Both: {
      return stepLoop(blockedRequests.left, Cons(blockedRequests.right, stack), parallel, sequential);
    }
    case BlockedRequestsTag.Single: {
      if (stack.isEmpty())
        return [parallel.concat(Parallel(blockedRequests.dataSource, blockedRequests.blockedRequest)), sequential];
      else
        return stepLoop(
          stack.head,
          stack.tail,
          parallel.concat(Parallel(blockedRequests.dataSource, blockedRequests.blockedRequest)),
          sequential,
        );
    }
  }
}

/**
 * @tsplus getter fncts.query.BlockedRequests flatten
 */
export function flatten<R>(blockedRequests: BlockedRequests<R>): List<Sequential<R>> {
  return flattenLoop(List(blockedRequests), List.empty());
}

function flattenLoop<R>(
  blockedRequests: List<BlockedRequests<R>>,
  flattened: List<Sequential<R>>,
): List<Sequential<R>> {
  const [parallel, sequential] = blockedRequests.foldLeft(
    [Parallel.empty as Parallel<R>, List.empty<BlockedRequests<R>>()] as const,
    ([parallel, sequential], blockedRequest) => {
      const [par, seq] = blockedRequest.step;
      return [parallel.concat(par), sequential.concat(seq)] as const;
    },
  );
  const updated = merge(flattened, parallel);
  if (sequential.isEmpty()) return updated.reverse;
  else return flattenLoop(sequential, updated);
}

function merge<R>(sequential: List<Sequential<R>>, parallel: Parallel<R>): List<Sequential<R>> {
  if (sequential.isEmpty()) return List(parallel.sequential);
  else if (parallel.isEmpty) return sequential;
  else if (sequential.head.keys.size === 1 && parallel.keys.size === 1 && sequential.head.keys == parallel.keys)
    return Cons(sequential.head.concat(parallel.sequential), sequential.tail);
  else return Cons(parallel.sequential, sequential);
}

/**
 * @tsplus getter fncts.query.BlockedRequests run
 */
export function run<R>(self: BlockedRequests<R>, __tsplusTrace?: string): IO<R, never, void> {
  return Query.currentCache.get.flatMap((cache) =>
    IO.foreachDiscard(self.flatten, (requestsByDataSource) =>
      IO.foreachConcurrentDiscard(requestsByDataSource.toIterable, ([dataSource, sequential]) =>
        Do((Δ) => {
          const completedRequests = Δ(dataSource.runAll(sequential.map((br) => br.map((r) => r.request))));
          const blockedRequests   = sequential.flatten;
          const leftovers         = completedRequests.requests().removeMany(blockedRequests.map((br) => br.request));
          Δ(IO.foreachDiscard(blockedRequests, (br) => br.result.set(completedRequests.lookup(br.request))));
          Δ(
            IO.foreachDiscard(leftovers, (request) =>
              Ref.make(completedRequests.lookup(request)).flatMap((ref) => cache.put(request, ref)),
            ),
          );
        }),
      ),
    ),
  );
}
