import type { Maybe } from "@fncts/base/data/Maybe";

export class TestArgs {
  constructor(
    readonly testSearchTerms: ReadonlyArray<string>,
    readonly tagSearchTerms: ReadonlyArray<string>,
    readonly testTaskPolicy: Maybe<string>,
  ) {}
}
