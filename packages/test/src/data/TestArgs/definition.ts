export class TestArgs {
  constructor(
    readonly testSearchTerms: ReadonlyArray<string>,
    readonly tagSearchTerms: ReadonlyArray<string>,
    readonly testTaskPolicy: Maybe<string>,
  ) {}
}
