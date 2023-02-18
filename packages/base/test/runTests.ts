import ConcSpec from "./ConcSpec.js";
import EitherSpec from "./EitherSpec.js";

(ConcSpec + EitherSpec).run().unsafeRunWith((exit) =>
  exit.match(
    () => process.exit(1),
    (code) => process.exit(code),
  ),
);
