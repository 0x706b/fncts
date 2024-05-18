import type { Request } from "@fncts/query/Request";

export class CompletedRequestMap {
  constructor(private map: HashMap<any, Either<any, any>>) {}

  static empty(): CompletedRequestMap {
    return new CompletedRequestMap(HashMap.empty());
  }

  concat(that: CompletedRequestMap) {
    return new CompletedRequestMap(this.map.union(that.map));
  }

  insert<E, A>(request: Request<E, A>, result: Either<E, A>): CompletedRequestMap {
    return new CompletedRequestMap(this.map.set(request, result));
  }

  insertMaybe<E, A>(request: Request<E, A>, result: Either<E, Maybe<A>>): CompletedRequestMap {
    return result.match(
      (e) => this.insert(request, Left(e)),
      (r) =>
        r.match(
          () => this,
          (a) => this.insert(request, Right(a)),
        ),
    );
  }

  lookup<E, A>(request: Request<E, A>): Maybe<Either<E, A>> {
    return this.map.get(request);
  }

  requests(): HashSet<Request<any, any>> {
    return this.map.keySet;
  }

  contains(request: any): boolean {
    return this.map.has(request);
  }
}
