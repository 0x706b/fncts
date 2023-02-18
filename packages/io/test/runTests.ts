import IOSpec from "./IOSpec.js";

IOSpec.run().unsafeRunWith((exit) => {
  console.log(exit);
  exit.match(
    () => process.exit(1),
    (code) => process.exit(code),
  );
});
