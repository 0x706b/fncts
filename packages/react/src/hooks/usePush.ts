import type { Push } from "@fncts/io/Push";

import React from "react";

import { useIO } from "./useIO.js";

export function usePush<R, E, A>(
  stream: Push<R, E, A>,
): [IO<R | Scope, never, void>, A | undefined, { interrupt: UIO<void> }];
export function usePush<R, E, A, B>(
  stream: Push<R, E, A>,
  initial: B,
): [IO<R | Scope, never, void>, A, { interrupt: UIO<void> }];
export function usePush<R, E, A>(
  stream: Push<R, E, A>,
  initial?: A,
): [IO<R | Scope, never, void>, A | undefined, { interrupt: UIO<void> }] {
  const [value, setValue] = React.useState(initial);
  const runStream         = React.useMemo(
    () =>
      stream
        .observe((value) => IO(setValue(value)))
        .catchAllCause((cause) =>
          IO(() => {
            throw new Error(cause.prettyPrint);
          }),
        ),
    [stream],
  );
  const [io, _, { interrupt }] = useIO(runStream);
  return [io, value, { interrupt }];
}
