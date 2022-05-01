import IOSpec from "./IOSpec.js";

IOSpec.run(IOSpec.spec)
  .provideLayer(IOSpec.runner.bootstrap)
  .unsafeRunWith((exit) =>
    exit.match(
      () => process.exit(1),
      (code) => process.exit(code),
    ),
  );
