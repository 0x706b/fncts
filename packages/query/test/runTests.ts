import TestSpec from "./TestSpec.js";

TestSpec.run(TestSpec.spec)
  .provideLayer(TestSpec.runner.bootstrap)
  .unsafeRunWith((exit) =>
    exit.match(
      () => process.exit(1),
      (code) => process.exit(code),
    ),
  );
