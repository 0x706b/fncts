import type { UIO } from "@fncts/base/control/IO";

import { Layer } from "@fncts/base/control/Layer";
import { Has } from "@fncts/base/prelude";

export abstract class TestLogger {
  abstract logLine(line: string): UIO<void>;
}
