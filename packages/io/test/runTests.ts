import IOSpec from "./IOSpec.js";

IOSpec.run(IOSpec.spec)
  .provideLayer(IOSpec.runner.bootstrap)
  .unsafeRunWith((exit) =>
    exit.match(
      (cause) => {
        console.log(cause.prettyPrint);
      },
      (code) => process.exit(code),
    ),
  );
