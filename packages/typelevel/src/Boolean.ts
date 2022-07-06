export declare const False: unique symbol;
export declare const True: unique symbol;

export type False = typeof False;
export type True = typeof True;
export type Boolean = True | False;

export type Or<B1 extends Boolean, B2 extends Boolean> = {
  [False]: {
    [False]: False;
    [True]: True;
  };
  [True]: {
    [False]: True;
    [True]: True;
  };
}[B1][B2];

export type And<B1 extends Boolean, B2 extends Boolean> = {
  [False]: {
    [False]: False;
    [True]: False;
  };
  [True]: {
    [False]: False;
    [True]: True;
  };
}[B1][B2];

export type Xor<B1 extends Boolean, B2 extends Boolean> = {
  [False]: {
    [False]: False;
    [True]: True;
  };
  [True]: {
    [False]: True;
    [True]: False;
  };
}[B1][B2];

export type Not<B extends Boolean> = {
  [False]: True;
  [True]: False;
}[B];
