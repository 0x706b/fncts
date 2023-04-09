import IOSpec from "./IOSpec.js";

IOSpec.run()
  .unsafeRunFiber()
  .addObserver((exit) => {
    console.log(exit);
    exit.match(
      () => process.exit(1),
      (code) => process.exit(code),
    );
  });
