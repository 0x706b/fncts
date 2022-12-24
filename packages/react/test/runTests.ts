import TestSpec from "./TestSpec.js";
import ConcSpec from "./ConcSpec.js"

ConcSpec.run(ConcSpec.spec)
  .provideLayer(TestSpec.runner.bootstrap)
  .unsafeRunWith((exit) =>
    exit.match(
      () => process.exit(1),
      (code) => process.exit(code),
    ),
  );
