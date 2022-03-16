export class GenFailureDetails<A = any> {
  constructor(readonly initialInput: A, readonly shrunkenInput: A, readonly iterations: number) {}
}
