export const enum ChannelTag {
  PipeTo = "PipeTo",
  ContinuationK = "ContinuationK",
  ContinuationFinalizer = "ContinuationFinalizer",
  Fold = "Fold",
  Bridge = "Bridge",
  Read = "Read",
  Done = "Done",
  Halt = "Halt",
  FromIO = "FromIO",
  Emit = "Emit",
  Defer = "Defer",
  Ensuring = "Ensuring",
  ConcatAll = "ConcatAll",
  BracketOut = "BracketOut",
  Give = "Give",
}

export abstract class Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  readonly _Env!: (_: Env) => void;
  readonly _InErr!: (_: InErr) => void;
  readonly _InElem!: (_: InElem) => void;
  readonly _InDone!: (_: InDone) => void;
  readonly _OutErr!: () => OutErr;
  readonly _OutElem!: () => OutElem;
  readonly _OutDone!: () => OutDone;
}
