import TestSpec from "./TestSpec.js";

TestSpec.run()
  .unsafeRunFiber()
  .addObserver((exit) =>
    exit.match(
      () => process.exit(1),
      (code) => process.exit(code),
    ),
  );
