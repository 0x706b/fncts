import type { Console } from "@fncts/io/Console";

import { LiveIOEnv } from "@fncts/io/IO";
import { Annotations } from "@fncts/test/control/Annotations";
import { Live } from "@fncts/test/control/Live";
import { Sized } from "@fncts/test/control/Sized";
import { TestClock } from "@fncts/test/control/TestClock";
import { TestConsole } from "@fncts/test/control/TestConsole";
import { TestRandom } from "@fncts/test/control/TestRandom";
import { TestConfig } from "@fncts/test/data/TestConfig";

export type TestEnvironment = Has<Annotations> &
  Has<Live> &
  Has<Sized> &
  Has<TestClock> &
  Has<TestConfig> &
  Has<TestRandom> &
  Has<Clock> &
  Has<Random> &
  Has<Console> &
  Has<TestConsole>;

export const LiveTestEnvironment: Layer<Has<Clock> & Has<Random> & Has<Console>, never, TestEnvironment> =
  Annotations.Live.and(Live.Default)
    .and(Sized.Live(100))
    .and(TestConfig.Live({ repeats: 100, retries: 100, samples: 200, shrinks: 1000 }))
    .and(TestRandom.Deterministic)
    .andTo(TestClock.Live)
    .andTo(TestConsole.Live);

export const TestEnvironment = LiveIOEnv.to(LiveTestEnvironment);
