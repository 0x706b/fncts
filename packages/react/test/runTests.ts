import TestSpec from "./TestSpec.js";

TestSpec.run().unsafeRunWith((exit) =>
  exit.match(
    () => process.exit(1),
    (code) => process.exit(code),
  ),
);
