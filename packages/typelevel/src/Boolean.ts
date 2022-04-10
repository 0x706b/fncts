export type False = 0;
export type True = 1;
export type Boolean = True | False;

export type Or<B1 extends Boolean, B2 extends Boolean> = {
  0: {
    0: 0;
    1: 1;
  };
  1: {
    0: 1;
    1: 1;
  };
}[B1][B2];

export type And<B1 extends Boolean, B2 extends Boolean> = {
  0: {
    0: 0,
    1: 0
  },
  1: {
    0: 0,
    1: 1
  }
}[B1][B2];

export type Xor<B1 extends Boolean, B2 extends Boolean> = {
  0: {
    0: 0,
    1: 1
  },
  1: {
    0: 1,
    1: 0
  }
}[B1][B2];

export type Not<B extends Boolean> = {
  0: 1,
  1: 0
}[B];