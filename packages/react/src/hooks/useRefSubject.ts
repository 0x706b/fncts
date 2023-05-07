import type { RefSubject } from "@fncts/io/RefSubject";

import React from "react";

import { useIO } from "./useIO.js";

export function useRefSubject<R, E, A, B>(
  stream: RefSubject<R, E, A, B>,
): [IO<R | Scope, never, void>, B, { interrupt: UIO<void> }] {
  const [value, setValue] = React.useState(stream.unsafeGet);
  const runStream         = React.useMemo(
    () =>
      stream.run({
        event: (value) => IO(setValue(value)),
        error: (cause) => {
          throw new Error(cause.prettyPrint);
        },
      }),
    [stream],
  );
  const [io, _, { interrupt }] = useIO(runStream);
  return [io, value, { interrupt }];
}
