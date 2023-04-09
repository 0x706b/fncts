import React from "react";

export function useScope(): Scope.Closeable {
  const scope = React.useRef(Scope.unsafeMake());

  React.useEffect(() => {
    return () => {
      scope.current.close(Exit.interrupt(FiberId.none)).unsafeRunFiber();
    };
  }, []);

  return scope.current;
}
