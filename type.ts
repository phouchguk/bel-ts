export class Pair {
  a: BelT;
  d: BelT;

  constructor(a: BelT, d: BelT) {
    this.a = a;
    this.d = d;
  }
}

export type Atom = number | string | symbol;
export type BelT = Atom | Pair;
