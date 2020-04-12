import { Fn } from "./value";

export class Cell {
  a: BelT;
  d: BelT;

  constructor(a: BelT, d: BelT) {
    this.a = a;
    this.d = d;
  }
}

export type ExpressionHandler = (x: BelT) => void;
export type Atom = number | string | symbol | Fn | null;
export type Pair = Cell | null;
export type BelT = Atom | Cell;
