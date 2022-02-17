export type Primitive = string | number | boolean | null | symbol;

export type Constructor<A> = { new (...args: any[]): A };
