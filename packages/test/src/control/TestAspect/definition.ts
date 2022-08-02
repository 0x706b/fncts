import type { Spec } from "@fncts/test/control/Spec";

export type TestAspect<R, E> = <R1, E1>(spec: Spec<R1, E1>) => Spec<R | R1, E | E1>;
