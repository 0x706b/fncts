export class NodeServerCloseError {
  readonly _tag = "NodeServerCloseError";
  constructor(readonly error: Error) {}
}

export class NodeServerListenError {
  readonly _tag = "NodeServerListenError";
  constructor(readonly error: Error) {}
}
