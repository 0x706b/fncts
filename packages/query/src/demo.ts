import { show } from "@fncts/base/data/Showable";
import { matchTag, matchTag_ } from "@fncts/base/util/pattern";
import { Console } from "@fncts/io/Console";
import { CompletedRequestMap } from "@fncts/query/CompletedRequestMap";
import { Batched } from "@fncts/query/DataSource";
import { StaticRequest } from "@fncts/query/Request";

const testData = {
  a: "A",
  b: "B",
  c: "C",
  d: "D",
};

class Get extends StaticRequest<{ readonly id: string }, string, string> {
  readonly _tag = "Get";
}

class GetAll extends StaticRequest<{}, string, Record<string, string>> {
  readonly _tag = "GetAll";
}

const backendGetAll: IO<never, never, Record<string, string>> = Do((Δ) => {
  Δ(Console.print("getAll called"));
  return testData;
});

const backendGetSome = (ids: Conc<string>): IO<never, never, Record<string, string>> =>
  Do((Δ) => {
    Δ(Console.print(`getSome ${show(Array.from(ids))} called`));
    return ids.foldLeft({} as Record<string, string>, (r, a) =>
      Dictionary.get(testData)
        .get(a)
        .match(
          () => r,
          (v) => ({ ...r, [a]: v }),
        ),
    );
  });

type Req = Get | GetAll;

const ds = Batched.make("test", (requests: Conc<Req>): IO<never, never, CompletedRequestMap> => {
  const [all, one] = requests.partition((req) => (req._tag === "GetAll" ? false : true));

  if (all.isNonEmpty) {
    return backendGetAll.map((allItems) =>
      Dictionary.get(allItems)
        .foldLeftWithIndex(CompletedRequestMap.empty(), (id, result, value) =>
          result.insert(new Get({ id }), Right(value)),
        )
        .insert(new GetAll(), Right(allItems)),
    );
  } else {
    return Do((Δ) => {
      const items = Δ(
        backendGetSome(one.flatMap(matchTag({ Get: ({ id }) => Conc.single(id), GetAll: () => Conc.empty<string>() }))),
      );
      return one.foldLeft(CompletedRequestMap.empty(), (result, req) =>
        matchTag_(req, {
          GetAll: () => result,
          Get: (req) =>
            Dictionary.get(items)
              .get(req.id)
              .match(
                () => result.insert(req, Left("not found")),
                (value) => result.insert(req, Right(value)),
              ),
        }),
      );
    });
  }
});

const getAll = Query.fromRequest(new GetAll(), ds);

const get = (id: string) => Query.fromRequest(new Get({ id }), ds);

const program = () => {
  const getSome = Query.foreachConcurrent(["c", "d"], get);
  const query   = getAll.zipWithBatched(getSome, (_, b) => b);
  return Do((Δ) => {
    const result = Δ(query.run);
    Δ(Console.show(result));
  });
};

program().unsafeRunAsyncWith((exit) => console.log(exit));
